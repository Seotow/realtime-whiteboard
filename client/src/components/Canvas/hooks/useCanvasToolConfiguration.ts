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
    opacity: number;
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
    opacity,
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
        switch (currentTool) {            case "pen":
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
                }                canvas.freeDrawingBrush.color = brushColor;
                canvas.freeDrawingBrush.width = brushSize;                // Apply opacity to the brush by converting color to rgba
                if (canvas.freeDrawingBrush && opacity < 1) {
                    const hexToRgba = (hex: string, alpha: number) => {
                        const r = parseInt(hex.slice(1, 3), 16);
                        const g = parseInt(hex.slice(3, 5), 16);
                        const b = parseInt(hex.slice(5, 7), 16);
                        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    };
                    
                    if (brushColor.startsWith('#')) {
                        canvas.freeDrawingBrush.color = hexToRgba(brushColor, opacity);
                    } else if (brushColor.startsWith('rgb(')) {
                        // Convert rgb to rgba
                        const rgbaColor = brushColor.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
                        canvas.freeDrawingBrush.color = rgbaColor;
                    } else if (brushColor.startsWith('rgba(')) {
                        // Update existing rgba opacity
                        const rgbaMatch = brushColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([^)]+)\)/);
                        if (rgbaMatch) {
                            canvas.freeDrawingBrush.color = `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
                        }
                    }
                }
                
                // Ensure pen tool is immediately ready for drawing
                if (canvas.isDrawingMode) {
                    canvas.defaultCursor = "crosshair";
                    canvas.hoverCursor = "crosshair";
                    canvas.freeDrawingCursor = "crosshair";
                    canvas.setCursor("crosshair");
                    
                    // Simulate activation
                    const canvasElement = canvas.getElement();
                    if (canvasElement) {
                        const rect = canvasElement.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            const event = new MouseEvent('mousemove', {
                                clientX: rect.left + rect.width / 2,
                                clientY: rect.top + rect.height / 2,
                                bubbles: true
                            });
                            canvasElement.dispatchEvent(event);
                        }
                    }
                }
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
        canvas.renderAll();    }, [
        fabricCanvasRef,
        currentTool,
        brushColor,
        brushSize,
        brushType,
        opacity,
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
