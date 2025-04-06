import React from "react";
import type { ToolType } from "../types/canvas";

interface CanvasInstructionsProps {
    isAdjustingBrushSize: boolean;
    currentTool: ToolType;
    brushSize: number;
    brushColor: string;
}

export const CanvasInstructions: React.FC<CanvasInstructionsProps> = ({
    isAdjustingBrushSize,
    currentTool,
    brushSize,
    brushColor,
}) => {
    return (
        <div className="canvas-instructions">
            <div>
                <kbd>Space</kbd> + drag to pan • <kbd>Alt</kbd> + scroll to zoom •{" "}
                <kbd>Alt</kbd> + right-click + drag to adjust brush size
            </div>
            {isAdjustingBrushSize && (
                <div className="brush-size-indicator">
                    <div className="brush-size-info">
                        <span>
                            {currentTool === "eraser" ? "Eraser" : "Brush"} Size: {brushSize}px
                        </span>
                        <div
                            className="brush-size-preview"
                            style={{
                                width: `${Math.min(brushSize * 2, 40)}px`,
                                height: `${Math.min(brushSize * 2, 40)}px`,
                                backgroundColor:
                                    currentTool === "eraser" ? "#ffffff" : brushColor,
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
    );
};
