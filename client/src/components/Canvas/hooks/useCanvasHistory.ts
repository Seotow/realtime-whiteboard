import { useCallback, useState } from "react";
import * as fabric from "fabric";
import { HISTORY_CONFIG } from "../constants/config";

interface UseCanvasHistoryProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

export const useCanvasHistory = ({ fabricCanvasRef }: UseCanvasHistoryProps) => {
    const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const saveCanvasState = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const canvasJson = JSON.stringify(canvas.toJSON());

        setCanvasHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(canvasJson);
            return newHistory.slice(-HISTORY_CONFIG.maxStates);
        });

        setHistoryIndex((prev) => Math.min(prev + 1, HISTORY_CONFIG.maxStates - 1));
    }, [fabricCanvasRef, historyIndex]);

    const handleUndo = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        if (historyIndex < 0 || canvasHistory.length === 0 || historyIndex === 0) {
            return;
        }

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
    }, [fabricCanvasRef, canvasHistory, historyIndex]);

    const handleRedo = useCallback(() => {
        if (!fabricCanvasRef.current) return;

        if (canvasHistory.length === 0 || historyIndex >= canvasHistory.length - 1) {
            return;
        }

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
    }, [fabricCanvasRef, canvasHistory, historyIndex]);

    return {
        saveCanvasState,
        handleUndo,
        handleRedo,
        canvasHistory,
        historyIndex,
    };
};
