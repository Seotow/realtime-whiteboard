import { CURSOR_CONFIG } from "../constants/config";

export const createToolCursor = (color: string, tool: string): string => {
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return "crosshair";
        }

        const cursorSize = CURSOR_CONFIG.size;
        canvas.width = cursorSize;
        canvas.height = cursorSize;

        const center = CURSOR_CONFIG.center;

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
        return "crosshair";
    }
};

export const getCanvasClasses = (
    isDrawing: boolean,
    isPanning: boolean,
    isSpacePressed: boolean,
    isAdjustingBrushSize: boolean,
    currentTool: string
): string => {
    const classes = ["canvas-container"];
    if (isDrawing) classes.push("drawing");
    if (isPanning) classes.push("panning");
    if (isSpacePressed) classes.push("space-pressed");
    if (isAdjustingBrushSize) classes.push("adjusting-brush-size");
    classes.push(`tool-${currentTool}`);
    return classes.join(" ");
};
