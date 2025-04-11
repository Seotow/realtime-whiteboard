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
    }, [fabricCanvasRef, historyIndex]);    const handleUndo = useCallback(() => {
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
                    
                    // Auto-focus and activate drawing mode after undo
                    setTimeout(() => {
                        if (fabricCanvasRef.current) {
                            const canvas = fabricCanvasRef.current;
                            const canvasElement = canvas.getElement();
                            
                            if (canvasElement) {
                                canvasElement.focus();
                                
                                // Re-activate drawing mode if it was active
                                if (canvas.isDrawingMode) {
                                    canvas.setCursor(canvas.freeDrawingCursor || 'crosshair');
                                    
                                    // Simulate mouse event to reactivate drawing context
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
                                
                                canvas.renderAll();
                                console.log('Canvas auto-focused and reactivated after undo');
                            }
                        }
                    }, 100);
                });
                setHistoryIndex(newIndex);
            } catch {
                // Error handled by not changing state
            }
        }
    }, [fabricCanvasRef, canvasHistory, historyIndex]);    const handleRedo = useCallback(() => {
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
                    
                    // Auto-focus and activate drawing mode after redo
                    setTimeout(() => {
                        if (fabricCanvasRef.current) {
                            const canvas = fabricCanvasRef.current;
                            const canvasElement = canvas.getElement();
                            
                            if (canvasElement) {
                                canvasElement.focus();
                                
                                // Re-activate drawing mode if it was active
                                if (canvas.isDrawingMode) {
                                    canvas.setCursor(canvas.freeDrawingCursor || 'crosshair');
                                    
                                    // Simulate mouse event to reactivate drawing context
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
                                
                                canvas.renderAll();
                                console.log('Canvas auto-focused and reactivated after redo');
                            }
                        }
                    }, 100);
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
