import React, { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { useBoardStore } from "../../stores/boardStore";
import { socketService } from "../../services/socketService";
import { useAuthStore } from "../../stores/authStore";
import {
    Pencil,
    MousePointer,
    Square,
    Circle,
    Triangle,
    Type,
    Eraser,
    Trash2,
    Download,
    Upload,
    RotateCcw,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Home,
    Minus,
    ArrowRight,
} from "lucide-react";
import "../../styles/canvas.css";

interface CanvasProps {
    boardId: string;
    width?: number;
    height?: number;
}

interface FabricObjectWithId extends fabric.FabricObject {
    id?: string;
}

export const Canvas: React.FC<CanvasProps> = ({
    boardId,
    width = 1920,
    height = 1080,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [currentTool, setCurrentTool] = useState<
        "pen" | "eraser" | "select" | "line" | "arrow"
    >("pen");

    const [brushColor, setBrushColor] = useState("#000000");
    const [brushSize, setBrushSize] = useState(2);
    // Brush size state
    const [brushType, setBrushType] = useState<"pencil" | "circle" | "spray">(
        "pencil"
    );
    const [zoom, setZoom] = useState(1);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [opacity, setOpacity] = useState(1);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<{
        x: number;
        y: number;
    } | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isAltPressed, setIsAltPressed] = useState(false);
    const [canvasInitialized, setCanvasInitialized] = useState(false);
    const [isAdjustingBrushSize, setIsAdjustingBrushSize] = useState(false);
    const isAdjustingBrushSizeRef = useRef(false); // Ref for immediate state access
    // Track brush size adjustment state
    const [lastBrushAdjustX, setLastBrushAdjustX] = useState<number | null>(
        null
    );
    // Track last brush adjustment position

    const { currentBoard, emitCanvasAction } = useBoardStore();
    const { user } = useAuthStore();

    // Predefined colors
    const presetColors = [
        "#000000",
        "#FFFFFF",
        "#FF0000",
        "#00FF00",
        "#0000FF",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#FFA500",
        "#800080",
        "#FFC0CB",
        "#A52A2A",
        "#808080",
        "#000080",
        "#008000",
    ]; // History management for undo/redo
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1); // Create a custom cursor based on tool and brush size
    const createToolCursor = useCallback(
        (size: number, color: string, tool: string) => {
            try {
                // Create a cursor based on tool, size and color
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    return "crosshair";
                }

                const cursorSize = 32; // Fixed size for testing
                canvas.width = cursorSize;
                canvas.height = cursorSize;

                const center = cursorSize / 2;

                ctx.clearRect(0, 0, cursorSize, cursorSize);

                // Simple colored circle
                ctx.fillStyle = tool === "eraser" ? "#FFFFFF" : color;
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(center, center, 8, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                // Simple crosshair
                ctx.strokeStyle = tool === "eraser" ? "#000000" : "#FFFFFF";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(center - 4, center);
                ctx.lineTo(center + 4, center);
                ctx.moveTo(center, center - 4);
                ctx.lineTo(center, center + 4);
                ctx.stroke();
                const dataUrl = canvas.toDataURL();
                const cursorString = `url(${dataUrl}) ${center} ${center}, crosshair`;
                return cursorString;
            } catch {
                // Fall back to crosshair cursor if there's an error
                return "crosshair";
            }
        },
        []
    ); // Update cursor when tool, size, or color changes
    const updateCursor = useCallback(() => {
        if (!fabricCanvasRef.current) {
            return;
        }

        const canvas = fabricCanvasRef.current;

        if (isAdjustingBrushSize) {
            // Show resize cursor during brush size adjustment
            canvas.defaultCursor = "ew-resize";
            canvas.hoverCursor = "ew-resize";
        } else if (isSpacePressed) {
            // Show grab cursor during space key press
            canvas.defaultCursor = "grab";
            canvas.hoverCursor = "grab";
        } else if (currentTool === "pen" || currentTool === "eraser") {
            // ALWAYS show custom brush cursor for pen and eraser tools

            // Test with simple cursor first
            const testCursor = "pointer"; // Simple test
            canvas.defaultCursor = testCursor;
            canvas.hoverCursor = testCursor;

            // Try custom cursor
            try {
                const customCursor = createToolCursor(
                    brushSize,
                    brushColor,
                    currentTool
                );
                canvas.defaultCursor = customCursor;
                canvas.hoverCursor = customCursor;
            } catch {
                // Fall back to crosshair if custom cursor fails
                canvas.defaultCursor = "crosshair";
                canvas.hoverCursor = "crosshair";
            }
        } else if (currentTool === "select") {
            canvas.defaultCursor = "default";
            canvas.hoverCursor = "move";
        } else {
            canvas.defaultCursor = "default";
            canvas.hoverCursor = "pointer";
        }

        // Force cursor update
        canvas.requestRenderAll();
    }, [
        isAdjustingBrushSize,
        isSpacePressed,
        currentTool,
        brushSize,
        brushColor,
        createToolCursor,
    ]);

    // Save canvas state to history
    const saveCanvasState = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const canvasJson = JSON.stringify(canvas.toJSON());

        setCanvasHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(canvasJson);
            return newHistory.slice(-20); // Keep only last 20 states
        });

        setHistoryIndex((prev) => Math.min(prev + 1, 19));
    }, [historyIndex]);

    // Event handlers using useCallback to prevent re-creation
    interface PathCreatedEvent {
        path: FabricObjectWithId;
    }

    const handlePathCreated = useCallback(
        (e: PathCreatedEvent) => {
            if (!e.path || !user) return;

            // Prevent path creation during panning or brush size adjustment
            if (isPanning || isAdjustingBrushSize || isSpacePressed) {
                if (fabricCanvasRef.current) {
                    fabricCanvasRef.current.remove(e.path);
                    fabricCanvasRef.current.renderAll();
                }
                return;
            }

            const pathData = e.path.toObject() as unknown as Record<
                string,
                unknown
            >;
            const pathObject = e.path as FabricObjectWithId;
            pathObject.id = pathObject.id || Date.now().toString();

            setIsDrawing(false);
            saveCanvasState();

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
        [
            user,
            boardId,
            emitCanvasAction,
            saveCanvasState,
            isPanning,
            isAdjustingBrushSize,
            isSpacePressed,
        ]
    );
    interface ObjectModifiedEvent {
        target: FabricObjectWithId;
        e: Event;
    }

    const handleObjectModified = useCallback(
        (e: ObjectModifiedEvent) => {
            if (!e.target || !user) return;

            const objectData = e.target.toObject() as unknown as Record<
                string,
                unknown
            >;
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
    interface SelectionCreatedEvent {
        selected: FabricObjectWithId[];
    }

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
        (e: fabric.TEvent<MouseEvent>) => {
            if (!user || !fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const pointer = canvas.getPointer(e.e); // Handle brush size adjustment (Alt + right mouse drag)
            if (isAdjustingBrushSizeRef.current && lastBrushAdjustX !== null) {
                // Brush size adjustment in progress
                const deltaX = pointer.x - lastBrushAdjustX;
                const sensitivity = 0.5; // Increased sensitivity for more responsive control

                // Use functional state update to ensure we get the latest brush size
                setBrushSize((currentBrushSize) => {
                    const newSize = Math.max(
                        1,
                        Math.min(50, currentBrushSize + deltaX * sensitivity)
                    );
                    const roundedSize = Math.round(newSize);

                    // Update canvas brush size immediately
                    if (
                        canvas.freeDrawingBrush &&
                        roundedSize !== currentBrushSize
                    ) {
                        canvas.freeDrawingBrush.width = roundedSize;
                    }

                    return roundedSize;
                });

                setLastBrushAdjustX(pointer.x);
                return;
            } // Handle panning - use raw mouse coordinates for smoother panning
            if (isPanning && lastPanPoint) {
                const currentX = e.e.clientX;
                const currentY = e.e.clientY;
                const deltaX = currentX - lastPanPoint.x;
                const deltaY = currentY - lastPanPoint.y;

                // Always pan regardless of small movements to prevent stuttering
                const vpt = canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += deltaX;
                    vpt[5] += deltaY;
                    canvas.setViewportTransform(vpt);
                    canvas.requestRenderAll();
                }

                // Update pan point for continuous movement
                setLastPanPoint({ x: currentX, y: currentY });
                return;
            } // Only emit cursor position if not actively doing special operations
            if (!isPanning && !isAdjustingBrushSizeRef.current) {
                socketService.emitCursorMove({
                    x: pointer.x,
                    y: pointer.y,
                    boardId,
                });
            }
        },
        [user, boardId, isPanning, lastPanPoint, lastBrushAdjustX]
    );
    const handleMouseDown = useCallback(
        (e: fabric.TEvent<MouseEvent>) => {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const mouseEvent = e.e as MouseEvent; // PRIORITY 1: Handle brush size adjustment FIRST - Alt + right mouse button
            if (
                (isAltPressed || mouseEvent.altKey) &&
                mouseEvent.button === 2
            ) {
                // Right mouse button - only for pen and eraser tools
                if (currentTool === "pen" || currentTool === "eraser") {
                    e.e.preventDefault();
                    e.e.stopPropagation();

                    // Immediately disable canvas interactions
                    canvas.isDrawingMode = false;
                    canvas.selection = false;
                    canvas.skipTargetFind = true;

                    const pointer = canvas.getPointer(e.e);
                    // Use state updates that ensure immediate effect
                    setIsAdjustingBrushSize(true);
                    isAdjustingBrushSizeRef.current = true; // Immediate ref update
                    setLastBrushAdjustX(pointer.x);

                    // Set resize cursor directly
                    canvas.defaultCursor = "ew-resize";
                    canvas.hoverCursor = "ew-resize";

                    return false; // Stop ALL further processing
                }
            }

            // PRIORITY 2: Handle space key panning SECOND - completely bypass canvas
            if (isSpacePressed) {
                // Completely prevent canvas from processing this event
                e.e.preventDefault();
                e.e.stopImmediatePropagation();

                // Disable ALL canvas event processing
                canvas.isDrawingMode = false;
                canvas.selection = false;
                canvas.skipTargetFind = true;

                // Start panning with raw coordinates
                const currentX = mouseEvent.clientX;
                const currentY = mouseEvent.clientY;
                setIsPanning(true);
                setLastPanPoint({ x: currentX, y: currentY });

                canvas.defaultCursor = "grabbing";
                canvas.hoverCursor = "grabbing";

                // Set up DOM-based panning to bypass canvas completely
                let lastX = currentX;
                let lastY = currentY;

                const handleDOMMouseMove = (domEvent: MouseEvent) => {
                    const canvas = fabricCanvasRef.current;
                    if (!canvas) return;

                    const newX = domEvent.clientX;
                    const newY = domEvent.clientY;

                    const deltaX = newX - lastX;
                    const deltaY = newY - lastY;

                    const vpt = canvas.viewportTransform;
                    if (vpt) {
                        vpt[4] += deltaX;
                        vpt[5] += deltaY;
                        canvas.setViewportTransform(vpt);
                        canvas.requestRenderAll();
                    }

                    // Update for next movement
                    lastX = newX;
                    lastY = newY;
                };

                const handleDOMMouseUp = () => {
                    // Clean up DOM event listeners
                    document.removeEventListener(
                        "mousemove",
                        handleDOMMouseMove
                    );
                    document.removeEventListener("mouseup", handleDOMMouseUp);

                    // Re-enable canvas interactions
                    const canvas = fabricCanvasRef.current;
                    if (canvas) {
                        canvas.skipTargetFind = false;
                        // Restore tool-specific state
                        if (currentTool === "pen" || currentTool === "eraser") {
                            canvas.isDrawingMode = true;
                            canvas.selection = false;
                        } else if (currentTool === "select") {
                            canvas.isDrawingMode = false;
                            canvas.selection = true;
                        }
                    }

                    setIsPanning(false);
                    setLastPanPoint(null);
                };

                // Use DOM events for panning to bypass canvas completely
                document.addEventListener("mousemove", handleDOMMouseMove);
                document.addEventListener("mouseup", handleDOMMouseUp);

                return false; // Stop ALL further event processing
            }
            // Handle middle mouse button panning
            if (mouseEvent.button === 1) {
                e.e.preventDefault();
                e.e.stopPropagation();

                // Force disable all canvas interactions
                canvas.isDrawingMode = false;
                canvas.selection = false;
                canvas.skipTargetFind = true;

                // Use raw mouse coordinates for consistent panning
                const currentX = mouseEvent.clientX;
                const currentY = mouseEvent.clientY;
                setIsPanning(true);
                setLastPanPoint({ x: currentX, y: currentY });

                canvas.defaultCursor = "grabbing";
                canvas.hoverCursor = "grabbing";

                return false;
            } // Only allow drawing/interaction if not in special modes
            if (
                !isPanning &&
                !isAdjustingBrushSizeRef.current &&
                !isSpacePressed
            ) {
                setIsDrawing(true);
            }
        },
        [isSpacePressed, isAltPressed, isPanning, currentTool]
    );
    const handleMouseUp = useCallback(() => {
        setIsDrawing(false);

        if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current; // Handle brush size adjustment end
            if (isAdjustingBrushSizeRef.current) {
                setIsAdjustingBrushSize(false);
                isAdjustingBrushSizeRef.current = false; // Immediate ref update
                setLastBrushAdjustX(null);

                // Restore drawing mode and cursor
                if (currentTool === "pen" || currentTool === "eraser") {
                    canvas.isDrawingMode = !isSpacePressed;
                    canvas.selection = false;
                    canvas.skipTargetFind = false;

                    // Update brush width for immediate effect - use current state
                    if (canvas.freeDrawingBrush) {
                        // Get current brush size from state callback to ensure we have latest value
                        setBrushSize((currentSize) => {
                            canvas.freeDrawingBrush!.width = currentSize;
                            return currentSize;
                        });
                    }
                }

                // Update cursor using our cursor system
                updateCursor();
            }

            // Handle panning end
            if (isPanning) {
                setIsPanning(false);
                setLastPanPoint(null);

                // Restore canvas interaction properties
                canvas.skipTargetFind = false;
                canvas.selection = currentTool === "select";

                // Restore cursor and drawing mode based on current tool and space state
                if (isSpacePressed) {
                    canvas.defaultCursor = "grab";
                    canvas.hoverCursor = "grab";
                } else {
                    // Restore tool-specific cursor and drawing mode
                    if (currentTool === "pen" || currentTool === "eraser") {
                        canvas.isDrawingMode = true;
                        canvas.defaultCursor = "crosshair";
                        canvas.hoverCursor = "crosshair";
                    } else if (currentTool === "select") {
                        canvas.isDrawingMode = false;
                        canvas.selection = true;
                        canvas.defaultCursor = "default";
                        canvas.hoverCursor = "move";
                    } else {
                        canvas.defaultCursor = "default";
                        canvas.hoverCursor = "pointer";
                    }
                }
            }
        }
    }, [isPanning, currentTool, isSpacePressed, updateCursor]);

    const handleWheel = useCallback(
        (e: fabric.TEvent<WheelEvent>) => {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const delta = e.e.deltaY;
            let currentZoom = canvas.getZoom();

            // Alt + scroll for zooming
            if (isAltPressed || e.e.ctrlKey) {
                e.e.preventDefault();
                e.e.stopPropagation();

                currentZoom *= 0.999 ** delta;
                if (currentZoom > 20) currentZoom = 20;
                if (currentZoom < 0.01) currentZoom = 0.01;

                const pointer = canvas.getPointer(e.e);
                canvas.zoomToPoint(
                    new fabric.Point(pointer.x, pointer.y),
                    currentZoom
                );
                setZoom(currentZoom);
                return false;
            }

            return true;
        },
        [isAltPressed]
    );

    // Utility functions
    const handleZoomIn = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const newZoom = Math.min(zoom * 1.1, 3);
        setZoom(newZoom);
        canvas.setZoom(newZoom);
        canvas.renderAll();
    }, [zoom]);

    const handleZoomOut = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const newZoom = Math.max(zoom * 0.9, 0.1);
        setZoom(newZoom);
        canvas.setZoom(newZoom);
        canvas.renderAll();
    }, [zoom]);

    const handleZoomReset = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        setZoom(1);
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
    }, []);
    const handleUndo = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        // Don't attempt undo if we don't have history or we're at the beginning
        if (
            historyIndex < 0 ||
            canvasHistory.length === 0 ||
            historyIndex === 0
        )
            return;

        const canvas = fabricCanvasRef.current;
        const newIndex = historyIndex - 1;

        if (canvasHistory[newIndex]) {
            try {
                canvas.loadFromJSON(canvasHistory[newIndex], () => {
                    canvas.renderAll();
                });
                setHistoryIndex(newIndex);
            } catch {
                // Error handled by not changing state
            }
        }
    }, [canvasHistory, historyIndex]);
    const handleRedo = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        // Don't attempt redo if we don't have history or we're at the end
        if (
            canvasHistory.length === 0 ||
            historyIndex >= canvasHistory.length - 1
        )
            return;

        const canvas = fabricCanvasRef.current;
        const newIndex = historyIndex + 1;

        if (canvasHistory[newIndex]) {
            try {
                canvas.loadFromJSON(canvasHistory[newIndex], () => {
                    canvas.renderAll();
                });
                setHistoryIndex(newIndex);
            } catch {
                // Error handled by not changing state
            }
        }
    }, [canvasHistory, historyIndex]);

    const handleExport = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const dataURL = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 1,
        });

        const link = document.createElement("a");
        link.download = `${currentBoard?.title || "whiteboard"}.png`;
        link.href = dataURL;
        link.click();
    }, [currentBoard?.title]);

    const handleImport = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && fabricCanvasRef.current) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgUrl = event.target?.result as string;
                    fabric.FabricImage.fromURL(imgUrl, {
                        crossOrigin: "anonymous",
                    }).then((img) => {
                        if (fabricCanvasRef.current) {
                            img.scale(0.5);
                            fabricCanvasRef.current.add(img);
                            fabricCanvasRef.current.renderAll();
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }, []); // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: "#ffffff",
            selection: false, // Will be set in tool change effect
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        // Load existing canvas content or save empty canvas as initial state
        if (currentBoard?.content) {
            try {
                canvas.loadFromJSON(currentBoard.content, () => {
                    canvas.renderAll();
                    saveCanvasState(); // Save initial state with content
                });
            } catch {
                // Still save initial state even if loading fails
                saveCanvasState();
            }
        } else {
            // Save initial empty state
            saveCanvasState();
        }

        // Initialize with default pen tool immediately
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = "#000000"; // Default color
        canvas.freeDrawingBrush.width = 2; // Default size

        // Mark canvas as initialized to trigger tool configuration
        setCanvasInitialized(true);
        return () => {
            canvas.dispose();
        };
    }, [currentBoard?.content, width, height, saveCanvasState]); // Removed brushColor, brushSize to prevent reset

    // Update event handlers when dependencies change
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;

        // Event handlers
        canvas.on("path:created", handlePathCreated);
        canvas.on("object:modified", handleObjectModified);
        canvas.on("selection:created", handleSelectionCreated);
        canvas.on("mouse:move", handleMouseMove);
        canvas.on("mouse:down", handleMouseDown);
        canvas.on("mouse:up", handleMouseUp);
        canvas.on("mouse:wheel", handleWheel);

        return () => {
            canvas.off("path:created", handlePathCreated);
            canvas.off("object:modified", handleObjectModified);
            canvas.off("selection:created", handleSelectionCreated);
            canvas.off("mouse:move", handleMouseMove);
            canvas.off("mouse:down", handleMouseDown);
            canvas.off("mouse:up", handleMouseUp);
            canvas.off("mouse:wheel", handleWheel);
        };
    }, [
        handlePathCreated,
        handleObjectModified,
        handleSelectionCreated,
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        handleWheel,
    ]); // Update canvas settings when tool changes
    useEffect(() => {
        if (!fabricCanvasRef.current || !canvasInitialized) return;

        const canvas = fabricCanvasRef.current;

        // Reset any active drawing state when changing tools
        setIsDrawing(false);
        setIsPanning(false);
        setLastPanPoint(null);

        // Disable all modes first
        canvas.isDrawingMode = false;
        canvas.selection = false; // Configure tool-specific settings
        switch (currentTool) {
            case "pen":
                // Only enable drawing mode if space is not pressed
                canvas.isDrawingMode =
                    !isSpacePressed &&
                    !isPanning &&
                    !isAdjustingBrushSizeRef.current;
                canvas.selection = false;

                // Set brush type and properties
                switch (brushType) {
                    case "circle":
                        canvas.freeDrawingBrush = new fabric.CircleBrush(
                            canvas
                        );
                        break;
                    case "spray":
                        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
                        break;
                    default:
                        canvas.freeDrawingBrush = new fabric.PencilBrush(
                            canvas
                        );
                }

                canvas.freeDrawingBrush.color = brushColor;
                canvas.freeDrawingBrush.width = brushSize;
                break;
            case "eraser": {
                // For eraser, use a white brush with destination-out composite operation
                // Only enable drawing mode if space is not pressed
                canvas.isDrawingMode =
                    !isSpacePressed &&
                    !isPanning &&
                    !isAdjustingBrushSizeRef.current;
                canvas.selection = false;

                // Create custom eraser brush
                const eraserBrush = new fabric.PencilBrush(canvas);
                eraserBrush.color = "#FFFFFF";
                eraserBrush.width = brushSize * 2;

                // Override the brush's _render method to use destination-out
                const originalRender = eraserBrush._render.bind(eraserBrush);
                eraserBrush._render = function () {
                    if (canvas.contextTop) {
                        canvas.contextTop.globalCompositeOperation =
                            "destination-out";
                    }
                    originalRender();
                    if (canvas.contextTop) {
                        canvas.contextTop.globalCompositeOperation =
                            "source-over";
                    }
                };

                canvas.freeDrawingBrush = eraserBrush;
                break;
            }

            case "select":
                canvas.isDrawingMode = false;
                canvas.selection = true;
                canvas.defaultCursor = "default";
                canvas.hoverCursor = "move";
                break;
            default:
                canvas.isDrawingMode = false;
                canvas.selection = true;
                canvas.defaultCursor = "default";
                canvas.hoverCursor = "pointer";
        }

        // Update cursor after tool configuration
        updateCursor();
        canvas.renderAll();
    }, [
        currentTool,
        brushColor,
        brushSize,
        brushType,
        canvasInitialized,
        isSpacePressed,
        isPanning,
        updateCursor,
    ]);

    // Update cursor when relevant state changes
    useEffect(() => {
        updateCursor();
    }, [
        updateCursor,
        isAdjustingBrushSize,
        isSpacePressed,
        brushSize,
        brushColor,
        currentTool,
    ]);

    // Socket event handlers
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        interface CanvasAction {
            type: "add" | "update" | "delete" | "clear";
            object?: Record<string, unknown>;
            objectId?: string;
        }

        const handleCanvasAction = (action: CanvasAction) => {
            if (!canvas) return;

            switch (action.type) {
                case "add": {
                    if (action.object) {
                        try {
                            fabric.util.enlivenObjects([action.object as any], {
                                reviver: function (object: any) {
                                    (object as FabricObjectWithId).id =
                                        action.objectId;
                                    canvas.add(object);
                                    canvas.renderAll();
                                },
                            } as any);
                        } catch {
                            // Object failed to add, silently handle the error
                        }
                    }
                    break;
                }
                case "update": {
                    const existingObj = canvas
                        .getObjects()
                        .find(
                            (obj: FabricObjectWithId) =>
                                obj.id === action.objectId
                        );
                    if (existingObj && action.object) {
                        existingObj.set(action.object);
                        canvas.renderAll();
                    }
                    break;
                }
                case "delete": {
                    const objToDelete = canvas
                        .getObjects()
                        .find(
                            (obj: FabricObjectWithId) =>
                                obj.id === action.objectId
                        );
                    if (objToDelete) {
                        canvas.remove(objToDelete);
                        canvas.renderAll();
                    }
                    break;
                }
                case "clear":
                    canvas.clear();
                    break;
                default:
                    break;
            }
        };
        interface DrawEndData {
            object?: Record<string, unknown>;
        }

        const handleDrawEnd = (data: DrawEndData) => {
            if (data.object) {
                try {
                    fabric.util.enlivenObjects([data.object as any], {
                        reviver: function (object: any) {
                            canvas.add(object);
                            canvas.renderAll();
                        },
                    } as any);
                } catch {
                    // Object failed to add, silently handle the error
                }
            }
        };

        socketService.on("canvas:action", handleCanvasAction);
        socketService.on("draw:end", handleDrawEnd);

        return () => {
            socketService.off("canvas:action", handleCanvasAction);
            socketService.off("draw:end", handleDrawEnd);
        };
    }, []);
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;

            // Prevent shortcuts when typing in text objects
            if (
                (e.target as HTMLElement)?.tagName === "INPUT" ||
                (e.target as HTMLElement)?.tagName === "TEXTAREA"
            ) {
                return;
            } // Handle space and alt keys for pan/zoom
            if (e.code === "Space" && !e.repeat) {
                e.preventDefault();
                setIsSpacePressed(true);
                if (!isPanning) {
                    canvas.defaultCursor = "grab";
                    // Immediately disable drawing mode when space is pressed
                    if (currentTool === "pen" || currentTool === "eraser") {
                        canvas.isDrawingMode = false;
                    }
                }
            }
            if (e.altKey) {
                setIsAltPressed(true);
            }

            switch (e.key.toLowerCase()) {
                case "delete":
                case "backspace": {
                    const activeObjects = canvas.getActiveObjects();
                    if (activeObjects.length > 0) {
                        activeObjects.forEach((obj: FabricObjectWithId) => {
                            if (obj.id && user) {
                                emitCanvasAction({
                                    type: "delete",
                                    objectId: obj.id,
                                    boardId,
                                    userId: user.id,
                                    timestamp: new Date(),
                                });
                            }
                        });
                        canvas.remove(...activeObjects);
                        canvas.discardActiveObject();
                        canvas.renderAll();
                    }
                    break;
                }
                case "a": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const objects = canvas.getObjects();
                        if (objects.length > 0) {
                            const selection = new fabric.ActiveSelection(
                                objects,
                                { canvas }
                            );
                            canvas.setActiveObject(selection);
                            canvas.renderAll();
                        }
                    }
                    break;
                }
                case "escape": {
                    canvas.discardActiveObject();
                    canvas.renderAll();
                    setShowColorPicker(false);
                    break;
                }
                case "p": {
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        setCurrentTool("pen");
                    }
                    break;
                }
                case "v": {
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        setCurrentTool("select");
                    }
                    break;
                }
                case "e": {
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        setCurrentTool("eraser");
                    }
                    break;
                }
                case "z": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            handleRedo();
                        } else {
                            handleUndo();
                        }
                    }
                    break;
                }
                case "y": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRedo();
                    }
                    break;
                }
                case "=":
                case "+": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomIn();
                    }
                    break;
                }
                case "-": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomOut();
                    }
                    break;
                }
                case "0": {
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomReset();
                    }
                    break;
                }
                default:
                    break;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                setIsSpacePressed(false);
                if (fabricCanvasRef.current && !isPanning) {
                    const canvas = fabricCanvasRef.current;
                    // Restore tool-specific cursor and behavior
                    if (currentTool === "pen" || currentTool === "eraser") {
                        canvas.defaultCursor = "crosshair";
                        canvas.hoverCursor = "crosshair";
                        canvas.isDrawingMode = true;
                    } else if (currentTool === "select") {
                        canvas.defaultCursor = "default";
                        canvas.hoverCursor = "move";
                        canvas.selection = true;
                    } else {
                        canvas.defaultCursor = "default";
                        canvas.hoverCursor = "pointer";
                    }
                }
            }
            if (!e.altKey) {
                setIsAltPressed(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        // Prevent context menu when Alt+Right-click for brush size adjustment
        const handleContextMenu = (e: MouseEvent) => {
            if (isAltPressed) {
                e.preventDefault();
            }
        };
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [
        boardId,
        user,
        emitCanvasAction,
        handleUndo,
        handleRedo,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        isPanning,
        isAltPressed,
        currentTool,
    ]);

    // Tool functions
    const addShape = (shapeType: "rectangle" | "circle" | "triangle") => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        let shape: fabric.FabricObject;

        switch (shapeType) {
            case "rectangle":
                shape = new fabric.Rect({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: brushColor,
                    stroke: "#000",
                    strokeWidth: 1,
                    opacity,
                });
                break;
            case "circle":
                shape = new fabric.Circle({
                    left: 100,
                    top: 100,
                    radius: 50,
                    fill: brushColor,
                    stroke: "#000",
                    strokeWidth: 1,
                    opacity,
                });
                break;
            case "triangle":
                shape = new fabric.Triangle({
                    left: 100,
                    top: 100,
                    width: 100,
                    height: 100,
                    fill: brushColor,
                    stroke: "#000",
                    strokeWidth: 1,
                    opacity,
                });
                break;
            default:
                return;
        }

        (shape as FabricObjectWithId).id = Date.now().toString();
        canvas.add(shape);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: (shape as FabricObjectWithId).id!,
            object: shape.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    };

    const addText = () => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        const text = new fabric.IText("Type here...", {
            left: 100,
            top: 100,
            fontSize: 20,
            fill: brushColor,
            opacity,
        });

        (text as FabricObjectWithId).id = Date.now().toString();
        canvas.add(text);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: (text as FabricObjectWithId).id!,
            object: text.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    };

    const clearCanvas = () => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        canvas.clear();
        saveCanvasState();

        emitCanvasAction({
            type: "clear",
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    };

    const addLine = () => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        const line = new fabric.Line([50, 100, 200, 100], {
            stroke: brushColor,
            strokeWidth: brushSize,
            opacity,
        });

        (line as FabricObjectWithId).id = Date.now().toString();
        canvas.add(line);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: (line as FabricObjectWithId).id!,
            object: line.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    };

    const addArrow = () => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;

        // Create arrow using path
        const arrowPath = "M 0 0 L 80 0 M 70 -5 L 80 0 L 70 5";
        const arrow = new fabric.Path(arrowPath, {
            left: 100,
            top: 100,
            stroke: brushColor,
            strokeWidth: brushSize,
            fill: "",
            opacity,
        });

        (arrow as FabricObjectWithId).id = Date.now().toString();
        canvas.add(arrow);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: (arrow as FabricObjectWithId).id!,
            object: arrow.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    };
    const getCanvasClasses = () => {
        const classes = ["canvas-container"];
        if (isDrawing) classes.push("drawing");
        if (isPanning) classes.push("panning");
        if (isSpacePressed) classes.push("space-pressed");
        if (isAdjustingBrushSize) classes.push("adjusting-brush-size");
        classes.push(`tool-${currentTool}`);
        return classes.join(" ");
    };

    return (
        <div className={getCanvasClasses()}>
            {/* Canvas */}
            <canvas ref={canvasRef} />
            {/* Enhanced Toolbar */}
            <div className="canvas-toolbar">
                {/* Drawing Tools */}
                <div className="tool-group">
                    <button
                        className={`tool-btn ${
                            currentTool === "pen" ? "active" : ""
                        }`}
                        onClick={() => setCurrentTool("pen")}
                        title="Pen Tool (P)">
                        <Pencil size={20} />
                    </button>
                    <button
                        className={`tool-btn ${
                            currentTool === "eraser" ? "active" : ""
                        }`}
                        onClick={() => setCurrentTool("eraser")}
                        title="Eraser Tool (E)">
                        <Eraser size={20} />
                    </button>
                    <button
                        className={`tool-btn ${
                            currentTool === "select" ? "active" : ""
                        }`}
                        onClick={() => setCurrentTool("select")}
                        title="Select Tool (V)">
                        <MousePointer size={20} />
                    </button>
                </div>

                {/* Color and Brush Settings */}
                <div className="tool-group">
                    <div className="color-picker-container">
                        <button
                            className="color-picker-btn"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            style={{ backgroundColor: brushColor }}
                            title="Color Picker"
                        />
                        {showColorPicker && (
                            <div className="color-picker-dropdown">
                                <div className="preset-colors">
                                    {presetColors.map((color) => (
                                        <button
                                            key={color}
                                            className={`color-preset ${
                                                brushColor === color
                                                    ? "active"
                                                    : ""
                                            }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => {
                                                setBrushColor(color);
                                                setShowColorPicker(false);
                                            }}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={brushColor}
                                    onChange={(e) =>
                                        setBrushColor(e.target.value)
                                    }
                                    className="custom-color-input"
                                />
                            </div>
                        )}
                    </div>

                    <div className="brush-size-container">
                        <label className="brush-size-label">Size</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={brushSize}
                            onChange={(e) =>
                                setBrushSize(Number(e.target.value))
                            }
                            className="brush-size-slider"
                        />
                        <span className="brush-size-value">{brushSize}px</span>
                    </div>

                    <div className="brush-type-container">
                        <label className="brush-type-label">Brush</label>
                        <select
                            value={brushType}
                            onChange={(e) =>
                                setBrushType(
                                    e.target.value as
                                        | "pencil"
                                        | "circle"
                                        | "spray"
                                )
                            }
                            className="brush-type-select">
                            <option value="pencil">Pencil</option>
                            <option value="circle">Circle</option>
                            <option value="spray">Spray</option>
                        </select>
                    </div>

                    <div className="opacity-container">
                        <label className="opacity-label">Opacity</label>
                        <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={opacity}
                            onChange={(e) => setOpacity(Number(e.target.value))}
                            className="opacity-slider"
                        />
                        <span className="opacity-value">
                            {Math.round(opacity * 100)}%
                        </span>
                    </div>
                </div>

                {/* Shape Tools */}
                <div className="tool-group">
                    <button
                        onClick={() => addShape("rectangle")}
                        className="tool-btn"
                        title="Add Rectangle">
                        <Square size={20} />
                    </button>
                    <button
                        onClick={() => addShape("circle")}
                        className="tool-btn"
                        title="Add Circle">
                        <Circle size={20} />
                    </button>
                    <button
                        onClick={() => addShape("triangle")}
                        className="tool-btn"
                        title="Add Triangle">
                        <Triangle size={20} />
                    </button>
                    <button
                        onClick={addLine}
                        className="tool-btn"
                        title="Add Line">
                        <Minus size={20} />
                    </button>
                    <button
                        onClick={addArrow}
                        className="tool-btn"
                        title="Add Arrow">
                        <ArrowRight size={20} />
                    </button>
                    <button
                        onClick={addText}
                        className="tool-btn"
                        title="Add Text">
                        <Type size={20} />
                    </button>
                </div>

                {/* Action Tools */}
                <div className="tool-group">
                    <button
                        onClick={handleUndo}
                        className="tool-btn"
                        title="Undo (Ctrl+Z)">
                        <RotateCcw size={20} />
                    </button>
                    <button
                        onClick={handleRedo}
                        className="tool-btn"
                        title="Redo (Ctrl+Y)">
                        <RotateCw size={20} />
                    </button>
                    <button
                        onClick={clearCanvas}
                        className="tool-btn danger"
                        title="Clear Canvas">
                        <Trash2 size={20} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div className="tool-group">
                    <button
                        onClick={handleZoomOut}
                        className="tool-btn"
                        title="Zoom Out">
                        <ZoomOut size={20} />
                    </button>
                    <span className="zoom-level">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="tool-btn"
                        title="Zoom In">
                        <ZoomIn size={20} />
                    </button>
                    <button
                        onClick={handleZoomReset}
                        className="tool-btn"
                        title="Reset Zoom">
                        <Home size={20} />
                    </button>
                </div>

                {/* File Operations */}
                <div className="tool-group">
                    <button
                        onClick={handleImport}
                        className="tool-btn"
                        title="Import Image">
                        <Upload size={20} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="tool-btn"
                        title="Export as PNG">
                        <Download size={20} />
                    </button>
                </div>
            </div>{" "}
            {/* Pan and Zoom Instructions */}
            <div className="canvas-instructions">
                <div>
                    <kbd>Space</kbd> + drag to pan • <kbd>Alt</kbd> + scroll to
                    zoom • <kbd>Alt</kbd> + right-click + drag to adjust brush
                    size
                </div>
                {isAdjustingBrushSize && (
                    <div className="brush-size-indicator">
                        <div className="brush-size-info">
                            <span>
                                {currentTool === "eraser" ? "Eraser" : "Brush"}{" "}
                                Size: {brushSize}px
                            </span>
                            <div
                                className="brush-size-preview"
                                style={{
                                    width: `${Math.min(brushSize * 2, 40)}px`,
                                    height: `${Math.min(brushSize * 2, 40)}px`,
                                    backgroundColor:
                                        currentTool === "eraser"
                                            ? "#ffffff"
                                            : brushColor,
                                    border:
                                        currentTool === "eraser"
                                            ? "2px solid #000000"
                                            : "1px solid #333",
                                    borderRadius: "50%",
                                    display: "inline-block",
                                    marginLeft: "10px",
                                    verticalAlign: "middle",
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
