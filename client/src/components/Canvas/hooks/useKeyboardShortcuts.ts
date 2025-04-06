import { useEffect } from "react";
import * as fabric from "fabric";
import type { FabricObjectWithId, CanvasAction, User, ToolType } from "../types/canvas";

interface UseKeyboardShortcutsProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    boardId: string;
    user: User | null;
    emitCanvasAction: (action: CanvasAction) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleZoomReset: () => void;
    isPanning: boolean;
    isAltPressed: boolean;
    currentTool: ToolType;
    setIsSpacePressed: (pressed: boolean) => void;
    setIsAltPressed: (pressed: boolean) => void;
    setCurrentTool: (tool: ToolType) => void;
    setShowColorPicker: (show: boolean) => void;
}

export const useKeyboardShortcuts = ({
    fabricCanvasRef,
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
    setIsSpacePressed,
    setIsAltPressed,
    setCurrentTool,
    setShowColorPicker,
}: UseKeyboardShortcutsProps) => {
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
            }

            // Handle space and alt keys for pan/zoom
            if (e.code === "Space" && !e.repeat) {
                e.preventDefault();
                setIsSpacePressed(true);
                if (!isPanning) {
                    canvas.defaultCursor = "grab";
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
                            const selection = new fabric.ActiveSelection(objects, { canvas });
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

        const handleContextMenu = (e: MouseEvent) => {
            if (isAltPressed) {
                e.preventDefault();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        document.addEventListener("contextmenu", handleContextMenu);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    }, [
        fabricCanvasRef,
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
        setIsSpacePressed,
        setIsAltPressed,
        setCurrentTool,
        setShowColorPicker,
    ]);
};
