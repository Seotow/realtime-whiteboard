import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { DEFAULT_CANVAS_CONFIG, DEFAULT_BRUSH_CONFIG } from "../constants/config";
import type { FabricCanvasData } from "../../../services/boardApi";

export const useCanvasInitialization = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvasRef: React.MutableRefObject<any>,
    width: number,
    height: number,
    currentBoardContent: FabricCanvasData | undefined,
    saveCanvasState: () => void,
    setCanvasInitialized: (initialized: boolean) => void,
    isDrawing?: boolean,
    isSavingContentRef?: React.MutableRefObject<boolean>
) => {
    const hasInitialized = useRef(false);
    const contentLoadedRef = useRef(false);
    const loadAttemptedRef = useRef(false);// Initialize canvas only once
    useEffect(() => {
        if (!canvasRef.current || hasInitialized.current) return;

        console.log('Initializing canvas...');
        hasInitialized.current = true;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width,
            height,
            backgroundColor: DEFAULT_CANVAS_CONFIG.backgroundColor,
            selection: DEFAULT_CANVAS_CONFIG.selection,
            preserveObjectStacking: DEFAULT_CANVAS_CONFIG.preserveObjectStacking,
        });

        fabricCanvasRef.current = canvas;        // Wait a bit to ensure canvas is fully mounted and context is ready
        setTimeout(() => {
            if (fabricCanvasRef.current) {                // Initialize with default pen tool
                canvas.isDrawingMode = true;
                canvas.selection = false;
                canvas.defaultCursor = "crosshair";
                canvas.hoverCursor = "crosshair";
                canvas.moveCursor = "crosshair";
                canvas.freeDrawingCursor = "crosshair";
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                canvas.freeDrawingBrush.color = DEFAULT_BRUSH_CONFIG.color;
                canvas.freeDrawingBrush.width = DEFAULT_BRUSH_CONFIG.size;                // Initialize loading flag as false
                (canvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
                
                // Force the canvas to be ready for drawing immediately
                canvas.setCursor(canvas.freeDrawingCursor || 'crosshair');
                
                // Auto-focus the canvas for better UX and activate drawing context
                const canvasElement = canvas.getElement();
                if (canvasElement) {
                    canvasElement.focus();
                    
                    // Make canvas element fully interactive
                    canvasElement.style.pointerEvents = 'auto';
                    canvasElement.style.touchAction = 'none';
                    
                    // Simulate a mouse interaction to fully activate the drawing context
                    const rect = canvasElement.getBoundingClientRect();
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    // Create and dispatch synthetic events to activate drawing
                    const mouseMoveEvent = new MouseEvent('mousemove', {
                        clientX: rect.left + centerX,
                        clientY: rect.top + centerY,
                        bubbles: true,
                        cancelable: true
                    });
                    
                    const mouseEnterEvent = new MouseEvent('mouseenter', {
                        clientX: rect.left + centerX,
                        clientY: rect.top + centerY,
                        bubbles: true,
                        cancelable: true
                    });
                    
                    canvasElement.dispatchEvent(mouseEnterEvent);
                    canvasElement.dispatchEvent(mouseMoveEvent);
                    
                    console.log('Canvas auto-focused and drawing context activated on initialization');
                }
                
                setCanvasInitialized(true);
                console.log('Canvas initialization complete');
                
                // Failsafe: ensure loading flag is cleared after a reasonable time
                setTimeout(() => {
                    if (fabricCanvasRef.current) {
                        (fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
                        console.log('Failsafe: Canvas loading flag cleared');
                    }
                }, 2000);
            }
        }, 50);
          return () => {
            hasInitialized.current = false;
            contentLoadedRef.current = false;
            loadAttemptedRef.current = false;
            if (canvas) {
                canvas.dispose();
            }
        };
    }, [canvasRef, fabricCanvasRef, width, height, setCanvasInitialized]);    // Load content separately to avoid re-initialization
    useEffect(() => {
        if (!fabricCanvasRef.current || !hasInitialized.current || contentLoadedRef.current || loadAttemptedRef.current) return;

        // Don't load content while user is actively drawing
        if (isDrawing) {
            console.log('Skipping content load while user is drawing');
            return;
        }

        // Don't load content when we're in the middle of a save operation
        if (isSavingContentRef?.current) {
            console.log('Skipping content load during save operation');
            return;
        }

        // Mark that we're attempting to load to prevent multiple attempts
        loadAttemptedRef.current = true;        // Don't reload content if canvas already has objects (user has been drawing)
        const fabricCanvas = fabricCanvasRef.current;
        if (fabricCanvas.getObjects().length > 0) {
            console.log('Canvas has objects, skipping database content load to preserve user drawings');
            contentLoadedRef.current = true;
            (fabricCanvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
            console.log('Canvas loading flag cleared - ready for saves');
            return;
        }

        const canvas = fabricCanvasRef.current;
        
        // Load existing canvas content or save empty canvas as initial state
        if (currentBoardContent && Object.keys(currentBoardContent).length > 0) {
            try {
                console.log('Loading canvas content from database...');                  // Wait for canvas to be fully ready before loading content
                const loadContent = () => {
                    // Check if canvas and its context are available
                    try {
                        // More robust way to check canvas readiness
                        if (!fabricCanvasRef.current || contentLoadedRef.current) {
                            return;
                        }
                        
                        const canvas = fabricCanvasRef.current;
                        
                        // Check if canvas is initialized and has required methods
                        try {
                            // Try to call a basic method to ensure canvas is ready
                            const canvasWidth = canvas.getWidth();
                            const canvasHeight = canvas.getHeight();
                            
                            if (!canvasWidth || !canvasHeight) {
                                console.log('Canvas dimensions not ready, retrying...');
                                setTimeout(loadContent, 50);
                                return;
                            }
                            
                            // Additional check - try to access canvas element safely
                            const canvasElement = canvas.getElement();
                            if (!canvasElement) {
                                console.log('Canvas element not ready, retrying...');
                                setTimeout(loadContent, 50);
                                return;
                            }
                            
                        } catch (error) {
                            console.log('Canvas not fully initialized, retrying...', error);
                            setTimeout(loadContent, 100);
                            return;
                        }
                        
                        console.log('Canvas context is ready, loading content...');
                        
                        // Set a flag to indicate we're loading content
                        (canvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = true;
                        
                        // FabricCanvasData is already an object, so use it directly
                        canvas.loadFromJSON(currentBoardContent, () => {
                            if (fabricCanvasRef.current && !contentLoadedRef.current) {
                                canvas.renderAll();
                                console.log('Canvas loaded from database successfully');
                                contentLoadedRef.current = true;                                // Clear the loading flag after a small delay
                                setTimeout(() => {
                                    if (fabricCanvasRef.current) {
                                        (canvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
                                        console.log('Canvas content loading completed');
                                          // Auto-focus and force render after content loads
                                        const canvasElement = canvas.getElement();
                                        if (canvasElement) {
                                            canvasElement.focus();
                                            canvas.renderAll();
                                            
                                            // Simulate mouse interaction to activate drawing context
                                            const rect = canvasElement.getBoundingClientRect();
                                            const centerX = rect.width / 2;
                                            const centerY = rect.height / 2;
                                            
                                            const mouseMoveEvent = new MouseEvent('mousemove', {
                                                clientX: rect.left + centerX,
                                                clientY: rect.top + centerY,
                                                bubbles: true,
                                                cancelable: true
                                            });
                                            canvasElement.dispatchEvent(mouseMoveEvent);
                                            
                                            // Additional render with delay for stubborn cases
                                            setTimeout(() => {
                                                if (fabricCanvasRef.current) {
                                                    fabricCanvasRef.current.renderAll();
                                                    console.log('Canvas auto-focused, drawing context activated, and re-rendered after content load');
                                                }
                                            }, 100);
                                        }
                                    }
                                }, 200);
                                
                                // Only save state after content is loaded to establish baseline
                                setTimeout(() => {
                                    if (fabricCanvasRef.current) {
                                        saveCanvasState();
                                    }
                                }, 300);
                            }
                        });
                    } catch (error) {
                        console.warn('Error checking canvas readiness:', error);
                        setTimeout(loadContent, 100);
                    }
                };
                
                // Start loading with a small delay to ensure canvas is fully initialized
                setTimeout(loadContent, 100);
                
            } catch (error) {
                console.warn('Failed to load canvas content, starting with empty canvas:', error);
                contentLoadedRef.current = true;
                (canvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
                saveCanvasState();
            }
        } else {
            console.log('No canvas content found, starting with empty canvas');
            contentLoadedRef.current = true;
            (canvas as fabric.Canvas & { _isLoadingContent?: boolean })._isLoadingContent = false;
            saveCanvasState();
        }
    }, [currentBoardContent, fabricCanvasRef, saveCanvasState, isDrawing, isSavingContentRef]);
};
