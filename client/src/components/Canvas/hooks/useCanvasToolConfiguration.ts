import { useEffect } from "react";
import * as fabric from "fabric";
import type { ToolType, BrushType } from "../types/canvas";

interface UseCanvasToolConfigurationProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    canvasInitialized: boolean;
    currentTool: ToolType;
    brushColor: string;
    brushSize: number;
    brushType: BrushType;
    isSpacePressed: boolean;
    isPanning: boolean;
    isAdjustingBrushSize: boolean;
    updateCursor: () => void;
    setIsDrawing: (drawing: boolean) => void;
    setIsPanning: (panning: boolean) => void;
    setLastPanPoint: (point: { x: number; y: number } | null) => void;
}

export const useCanvasToolConfiguration = ({
    fabricCanvasRef,
    canvasInitialized,
    currentTool,
    brushColor,
    brushSize,
    brushType,
    isSpacePressed,
    isPanning,
    isAdjustingBrushSize,
    updateCursor,
    setIsDrawing,
    setIsPanning,
    setLastPanPoint,
}: UseCanvasToolConfigurationProps) => {
    useEffect(() => {
        if (!fabricCanvasRef.current || !canvasInitialized) return;

        const canvas = fabricCanvasRef.current;

        // Reset any active drawing state when changing tools
        setIsDrawing(false);
        setIsPanning(false);
        setLastPanPoint(null);

        // Disable all modes first
        canvas.isDrawingMode = false;
        canvas.selection = false;

        // Configure tool-specific settings
        switch (currentTool) {
            case "pen":
                canvas.isDrawingMode = !isSpacePressed && !isPanning && !isAdjustingBrushSize;
                canvas.selection = false;

                // Set brush type and properties
                switch (brushType) {
                    case "circle":
                        canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
                        break;
                    case "spray":
                        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
                        break;
                    default:
                        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                }

                canvas.freeDrawingBrush.color = brushColor;
                canvas.freeDrawingBrush.width = brushSize;
                break;

            case "eraser": {
                canvas.isDrawingMode = !isSpacePressed && !isPanning && !isAdjustingBrushSize;
                canvas.selection = false;

                // Create custom eraser brush
                const eraserBrush = new fabric.PencilBrush(canvas);
                eraserBrush.color = "#FFFFFF";
                eraserBrush.width = brushSize * 2;

                // Override the brush's _render method to use destination-out
                const originalRender = eraserBrush._render.bind(eraserBrush);
                eraserBrush._render = function () {
                    if (canvas.contextTop) {
                        canvas.contextTop.globalCompositeOperation = "destination-out";
                    }
                    originalRender();
                    if (canvas.contextTop) {
                        canvas.contextTop.globalCompositeOperation = "source-over";
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
        fabricCanvasRef,
        currentTool,
        brushColor,
        brushSize,
        brushType,
        canvasInitialized,
        isSpacePressed,
        isPanning,
        isAdjustingBrushSize,
        updateCursor,
        setIsDrawing,
        setIsPanning,
        setLastPanPoint,
    ]);
};
