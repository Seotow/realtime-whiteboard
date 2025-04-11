import { useEffect, useCallback } from "react";
import * as fabric from "fabric";

interface UseCanvasFocusProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    isCanvasInitialized: boolean;
}

export const useCanvasFocus = ({
    fabricCanvasRef,
    isCanvasInitialized,
}: UseCanvasFocusProps) => {
      // Function to focus the canvas and ensure it's properly rendered and ready for drawing
    const focusCanvas = useCallback(() => {
        if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current;
            const canvasElement = canvas.getElement();
            
            if (canvasElement) {
                // Focus the canvas element
                canvasElement.focus();
                
                // Ensure drawing mode is properly activated
                if (canvas.isDrawingMode) {
                    // Trigger a synthetic mouse event to activate drawing context
                    const rect = canvasElement.getBoundingClientRect();
                    const mouseEvent = new MouseEvent('mousemove', {
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2,
                        bubbles: true,
                        cancelable: true
                    });
                    canvasElement.dispatchEvent(mouseEvent);
                }
                
                // Force a render to ensure content is visible
                canvas.renderAll();
                
                // Additional render after a small delay for safety, plus drawing mode re-activation
                setTimeout(() => {
                    if (fabricCanvasRef.current) {
                        const canvas = fabricCanvasRef.current;
                        canvas.renderAll();
                        
                        // Ensure cursor is set correctly for drawing
                        if (canvas.isDrawingMode) {
                            canvas.setCursor(canvas.freeDrawingCursor || 'crosshair');
                        }
                        
                        console.log('Canvas focused, rendered, and drawing mode activated');
                    }
                }, 50);
                
                console.log('Canvas focused with render and drawing activation');
                return true;
            }
        }
        return false;
    }, [fabricCanvasRef]);

    // Auto-focus when canvas becomes initialized
    useEffect(() => {
        if (isCanvasInitialized) {
            setTimeout(() => {
                focusCanvas();
            }, 100);
        }
    }, [isCanvasInitialized, focusCanvas]);

    // Focus canvas when user clicks anywhere in the canvas area
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;
        const canvasElement = canvas.getElement();
        
        if (!canvasElement) return;

        const handleCanvasClick = () => {
            focusCanvas();
        };

        const handleCanvasMouseEnter = () => {
            focusCanvas();
        };

        // Add event listeners
        canvasElement.addEventListener('click', handleCanvasClick);
        canvasElement.addEventListener('mouseenter', handleCanvasMouseEnter);

        return () => {
            canvasElement.removeEventListener('click', handleCanvasClick);
            canvasElement.removeEventListener('mouseenter', handleCanvasMouseEnter);
        };
    }, [fabricCanvasRef, focusCanvas]);

    // Focus on window focus (when user comes back to the tab)
    useEffect(() => {
        const handleWindowFocus = () => {
            setTimeout(() => {
                focusCanvas();
            }, 100);
        };

        window.addEventListener('focus', handleWindowFocus);
        
        return () => {
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, [focusCanvas]);

    return {
        focusCanvas,
    };
};
