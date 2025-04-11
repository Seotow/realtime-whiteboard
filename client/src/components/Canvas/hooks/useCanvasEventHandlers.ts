import { useCallback } from "react";
import * as fabric from "fabric";
import { socketService } from "../../../services/socketService";
import { BRUSH_SIZE_CONFIG } from "../constants/config";
import type { 
    FabricObjectWithId, 
    PathCreatedEvent, 
    ObjectModifiedEvent, 
    SelectionCreatedEvent,
    CanvasAction,
    User
} from "../types/canvas";

interface UseCanvasEventHandlersProps {
    user: User | null;
    boardId: string;
    emitCanvasAction: (action: CanvasAction) => void;
    saveCanvasState: () => void;
    isPanning: boolean;
    isAdjustingBrushSize: boolean;
    isSpacePressed: boolean;
    setIsDrawing: (drawing: boolean) => void;
    setIsPanning: (panning: boolean) => void;
    setLastPanPoint: (point: { x: number; y: number } | null) => void;
    setBrushSize: (size: number | ((prev: number) => number)) => void;
    setLastBrushAdjustX: (x: number | null) => void;
    setIsAdjustingBrushSize: (adjusting: boolean) => void;
    isAdjustingBrushSizeRef: React.MutableRefObject<boolean>;
    lastPanPoint: { x: number; y: number } | null;
    lastBrushAdjustX: number | null;
    currentTool: string;
    isAltPressed: boolean;
    updateCursor: () => void;
}

export const useCanvasEventHandlers = ({
    user,
    boardId,
    emitCanvasAction,
    saveCanvasState,
    isPanning,
    isAdjustingBrushSize,
    isSpacePressed,
    setIsDrawing,
    setIsPanning,
    setLastPanPoint,
    setBrushSize,
    setLastBrushAdjustX,
    setIsAdjustingBrushSize,
    isAdjustingBrushSizeRef,
    lastPanPoint,
    lastBrushAdjustX,
    currentTool,
    isAltPressed,
    updateCursor,
}: UseCanvasEventHandlersProps) => {    const handlePathCreated = useCallback(
        (e: PathCreatedEvent, fabricCanvas: fabric.Canvas) => {
            if (!e.path || !user) return;

            if (isPanning || isAdjustingBrushSize || isSpacePressed) {
                fabricCanvas.remove(e.path);
                fabricCanvas.renderAll();
                return;
            }

            const pathData = e.path.toObject() as unknown as Record<string, unknown>;
            const pathObject = e.path as FabricObjectWithId;
            pathObject.id = pathObject.id || Date.now().toString();

            console.log('Path created, setting isDrawing to false');
            setIsDrawing(false);

            // Delay the canvas state save to avoid race conditions
            setTimeout(() => {
                console.log('Saving canvas state after path creation');
                saveCanvasState();
            }, 100);

            emitCanvasAction({
                type: "add",
                objectId: pathObject.id,
                object: pathData,
                boardId,
                userId: user.id,
                timestamp: new Date(),
            });

            socketService.emitDrawEnd({
                boardId,
                object: pathData,
            });
        },
        [user, boardId, emitCanvasAction, saveCanvasState, isPanning, isAdjustingBrushSize, isSpacePressed, setIsDrawing]
    );

    const handleObjectModified = useCallback(
        (e: ObjectModifiedEvent) => {
            if (!e.target || !user) return;

            const objectData = e.target.toObject() as unknown as Record<string, unknown>;
            const targetObject = e.target as FabricObjectWithId;

            saveCanvasState();

            emitCanvasAction({
                type: "update",
                objectId: targetObject.id || Date.now().toString(),
                object: objectData,
                boardId,
                userId: user.id,
                timestamp: new Date(),
            });
        },
        [user, boardId, emitCanvasAction, saveCanvasState]
    );

    const handleSelectionCreated = useCallback(
        (e: SelectionCreatedEvent) => {
            if (!e.selected || !user) return;

            const selectedIds = e.selected
                .map((obj: FabricObjectWithId) => obj.id || "")
                .filter(Boolean);
            
            socketService.emitSelectionChange({
                objects: selectedIds,
                boardId,
            });
        },
        [user, boardId]
    );

    const handleMouseMove = useCallback(
        (e: fabric.TEvent<MouseEvent>, fabricCanvas: fabric.Canvas) => {
            if (!user) return;

            const pointer = fabricCanvas.getPointer(e.e);

            if (isAdjustingBrushSizeRef.current && lastBrushAdjustX !== null) {
                const deltaX = pointer.x - lastBrushAdjustX;
                const sensitivity = BRUSH_SIZE_CONFIG.sensitivity;

                setBrushSize((currentBrushSize) => {
                    const newSize = Math.max(
                        BRUSH_SIZE_CONFIG.min,
                        Math.min(BRUSH_SIZE_CONFIG.max, currentBrushSize + deltaX * sensitivity)
                    );
                    const roundedSize = Math.round(newSize);

                    if (fabricCanvas.freeDrawingBrush && roundedSize !== currentBrushSize) {
                        fabricCanvas.freeDrawingBrush.width = roundedSize;
                    }

                    return roundedSize;
                });

                setLastBrushAdjustX(pointer.x);
                return;
            }

            if (isPanning && lastPanPoint) {
                const currentX = e.e.clientX;
                const currentY = e.e.clientY;
                const deltaX = currentX - lastPanPoint.x;
                const deltaY = currentY - lastPanPoint.y;

                const vpt = fabricCanvas.viewportTransform;
                if (vpt) {
                    vpt[4] += deltaX;
                    vpt[5] += deltaY;
                    fabricCanvas.setViewportTransform(vpt);
                    fabricCanvas.requestRenderAll();
                }

                setLastPanPoint({ x: currentX, y: currentY });
                return;
            }

            if (!isPanning && !isAdjustingBrushSizeRef.current) {
                socketService.emitCursorMove({
                    x: pointer.x,
                    y: pointer.y,
                    boardId,
                });
            }
        },
        [user, boardId, isPanning, lastPanPoint, lastBrushAdjustX, setBrushSize, setLastBrushAdjustX, isAdjustingBrushSizeRef, setLastPanPoint]
    );

    const handleMouseDown = useCallback(
        (e: fabric.TEvent<MouseEvent>, fabricCanvas: fabric.Canvas) => {
            const mouseEvent = e.e as MouseEvent;

            // Handle brush size adjustment
            if ((isAltPressed || mouseEvent.altKey) && mouseEvent.button === 2) {
                if (currentTool === "pen" || currentTool === "eraser") {
                    e.e.preventDefault();
                    e.e.stopPropagation();

                    fabricCanvas.isDrawingMode = false;
                    fabricCanvas.selection = false;
                    fabricCanvas.skipTargetFind = true;

                    const pointer = fabricCanvas.getPointer(e.e);
                    setIsAdjustingBrushSize(true);
                    isAdjustingBrushSizeRef.current = true;
                    setLastBrushAdjustX(pointer.x);

                    fabricCanvas.defaultCursor = "ew-resize";
                    fabricCanvas.hoverCursor = "ew-resize";

                    return false;
                }
            }

            // Handle space key panning
            if (isSpacePressed) {
                e.e.preventDefault();
                e.e.stopImmediatePropagation();

                fabricCanvas.isDrawingMode = false;
                fabricCanvas.selection = false;
                fabricCanvas.skipTargetFind = true;

                const currentX = mouseEvent.clientX;
                const currentY = mouseEvent.clientY;
                setIsPanning(true);
                setLastPanPoint({ x: currentX, y: currentY });

                fabricCanvas.defaultCursor = "grabbing";
                fabricCanvas.hoverCursor = "grabbing";

                // DOM-based panning
                let lastX = currentX;
                let lastY = currentY;

                const handleDOMMouseMove = (domEvent: MouseEvent) => {
                    const newX = domEvent.clientX;
                    const newY = domEvent.clientY;
                    const deltaX = newX - lastX;
                    const deltaY = newY - lastY;

                    const vpt = fabricCanvas.viewportTransform;
                    if (vpt) {
                        vpt[4] += deltaX;
                        vpt[5] += deltaY;
                        fabricCanvas.setViewportTransform(vpt);
                        fabricCanvas.requestRenderAll();
                    }

                    lastX = newX;
                    lastY = newY;
                };

                const handleDOMMouseUp = () => {
                    document.removeEventListener("mousemove", handleDOMMouseMove);
                    document.removeEventListener("mouseup", handleDOMMouseUp);

                    fabricCanvas.skipTargetFind = false;
                    if (currentTool === "pen" || currentTool === "eraser") {
                        fabricCanvas.isDrawingMode = true;
                        fabricCanvas.selection = false;
                    } else if (currentTool === "select") {
                        fabricCanvas.isDrawingMode = false;
                        fabricCanvas.selection = true;
                    }

                    setIsPanning(false);
                    setLastPanPoint(null);
                };

                document.addEventListener("mousemove", handleDOMMouseMove);
                document.addEventListener("mouseup", handleDOMMouseUp);

                return false;
            }

            // Handle middle mouse button panning
            if (mouseEvent.button === 1) {
                e.e.preventDefault();
                e.e.stopPropagation();

                fabricCanvas.isDrawingMode = false;
                fabricCanvas.selection = false;
                fabricCanvas.skipTargetFind = true;

                const currentX = mouseEvent.clientX;
                const currentY = mouseEvent.clientY;
                setIsPanning(true);
                setLastPanPoint({ x: currentX, y: currentY });

                fabricCanvas.defaultCursor = "grabbing";
                fabricCanvas.hoverCursor = "grabbing";

                return false;
            }

            if (!isPanning && !isAdjustingBrushSizeRef.current && !isSpacePressed) {
                setIsDrawing(true);
            }
        },
        [isSpacePressed, isAltPressed, isPanning, currentTool, setIsAdjustingBrushSize, setLastBrushAdjustX, isAdjustingBrushSizeRef, setIsPanning, setLastPanPoint, setIsDrawing]
    );

    const handleMouseUp = useCallback(
        (fabricCanvas: fabric.Canvas) => {
            setIsDrawing(false);

            if (isAdjustingBrushSizeRef.current) {
                setIsAdjustingBrushSize(false);
                isAdjustingBrushSizeRef.current = false;
                setLastBrushAdjustX(null);

                if (currentTool === "pen" || currentTool === "eraser") {
                    fabricCanvas.isDrawingMode = !isSpacePressed;
                    fabricCanvas.selection = false;
                    fabricCanvas.skipTargetFind = false;

                    if (fabricCanvas.freeDrawingBrush) {
                        setBrushSize((currentSize) => {
                            fabricCanvas.freeDrawingBrush!.width = currentSize;
                            return currentSize;
                        });
                    }
                }

                updateCursor();
            }

            if (isPanning) {
                setIsPanning(false);
                setLastPanPoint(null);

                fabricCanvas.skipTargetFind = false;
                fabricCanvas.selection = currentTool === "select";

                if (isSpacePressed) {
                    fabricCanvas.defaultCursor = "grab";
                    fabricCanvas.hoverCursor = "grab";
                } else {
                    if (currentTool === "pen" || currentTool === "eraser") {
                        fabricCanvas.isDrawingMode = true;
                        fabricCanvas.defaultCursor = "crosshair";
                        fabricCanvas.hoverCursor = "crosshair";
                    } else if (currentTool === "select") {
                        fabricCanvas.isDrawingMode = false;
                        fabricCanvas.selection = true;
                        fabricCanvas.defaultCursor = "default";
                        fabricCanvas.hoverCursor = "move";
                    } else {
                        fabricCanvas.defaultCursor = "default";
                        fabricCanvas.hoverCursor = "pointer";
                    }
                }
            }
        },
        [isPanning, currentTool, isSpacePressed, updateCursor, setIsDrawing, setIsAdjustingBrushSize, setLastBrushAdjustX, isAdjustingBrushSizeRef, setBrushSize, setIsPanning, setLastPanPoint]
    );

    return {
        handlePathCreated,
        handleObjectModified,
        handleSelectionCreated,
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
    };
};
