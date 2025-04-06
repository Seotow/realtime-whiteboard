import { useEffect } from "react";
import * as fabric from "fabric";
import { DEFAULT_CANVAS_CONFIG, DEFAULT_BRUSH_CONFIG } from "../constants/config";

export const useCanvasInitialization = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvasRef: React.MutableRefObject<any>,
    width: number,
    height: number,
    currentBoardContent: string | undefined,
    saveCanvasState: () => void,
    setCanvasInitialized: (initialized: boolean) => void
) => {

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: DEFAULT_CANVAS_CONFIG.backgroundColor,
            selection: DEFAULT_CANVAS_CONFIG.selection,
            preserveObjectStacking: DEFAULT_CANVAS_CONFIG.preserveObjectStacking,
        });

        fabricCanvasRef.current = canvas;

        // Load existing canvas content or save empty canvas as initial state
        if (currentBoardContent) {
            try {
                canvas.loadFromJSON(currentBoardContent, () => {
                    canvas.renderAll();
                    saveCanvasState();
                });
            } catch {
                saveCanvasState();
            }
        } else {
            saveCanvasState();
        }

        // Initialize with default pen tool immediately
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.defaultCursor = "crosshair";
        canvas.hoverCursor = "crosshair";
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = DEFAULT_BRUSH_CONFIG.color;
        canvas.freeDrawingBrush.width = DEFAULT_BRUSH_CONFIG.size;        setCanvasInitialized(true);
        
        return () => {
            canvas.dispose();
        };
    }, [currentBoardContent, width, height, saveCanvasState, setCanvasInitialized, canvasRef, fabricCanvasRef]);
};
