import { useCallback, useEffect } from "react";
import * as fabric from "fabric";
import { createToolCursor } from "../utils/cursor";
import type { ToolType } from "../types/canvas";

interface UseCanvasCursorProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    isAdjustingBrushSize: boolean;
    isSpacePressed: boolean;
    currentTool: ToolType;
    brushColor: string;
}

export const useCanvasCursor = ({
    fabricCanvasRef,
    isAdjustingBrushSize,
    isSpacePressed,
    currentTool,
    brushColor,
}: UseCanvasCursorProps) => {
    const updateCursor = useCallback(() => {
        if (!fabricCanvasRef.current) {
            return;
        }

        const canvas = fabricCanvasRef.current;

        if (isAdjustingBrushSize) {
            canvas.defaultCursor = "ew-resize";
            canvas.hoverCursor = "ew-resize";
        } else if (isSpacePressed) {
            canvas.defaultCursor = "grab";
            canvas.hoverCursor = "grab";
        } else if (currentTool === "pen" || currentTool === "eraser") {
            const testCursor = "pointer";
            canvas.defaultCursor = testCursor;
            canvas.hoverCursor = testCursor;

            try {
                const customCursor = createToolCursor(brushColor, currentTool);
                canvas.defaultCursor = customCursor;
                canvas.hoverCursor = customCursor;
            } catch {
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

        canvas.requestRenderAll();    }, [
        fabricCanvasRef,
        isAdjustingBrushSize,
        isSpacePressed,
        currentTool,
        brushColor,
    ]);

    useEffect(() => {
        updateCursor();
    }, [updateCursor]);

    return { updateCursor };
};
