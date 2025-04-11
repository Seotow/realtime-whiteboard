import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useBoardStore } from "../../../stores/boardStore";
import { useAuthStore } from "../../../stores/authStore";

interface UseCanvasAutoSaveProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    boardId: string;
    isCanvasInitialized: boolean;
    isDrawing?: boolean;
}

export const useCanvasAutoSave = ({
    fabricCanvasRef,
    boardId,
    isCanvasInitialized,
    isDrawing = false,
}: UseCanvasAutoSaveProps) => {
    const { saveCanvasContent } = useBoardStore();
    const { user } = useAuthStore();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSaveContentRef = useRef<string>("");    const [isSaving, setIsSaving] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);    const [showSaveToast, setShowSaveToast] = useState(false);
    const isLoadingInitialContentRef = useRef(true);
    const isSavingContentRef = useRef(false);const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset loading flag when canvas is initialized with a longer delay
    useEffect(() => {
        if (isCanvasInitialized) {
            // Clear any existing timeout
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
            
            // Give more time for content loading to complete
            loadingTimeoutRef.current = setTimeout(() => {
                console.log('Auto-save enabled after initialization delay');
                isLoadingInitialContentRef.current = false;
            }, 2000); // Increased to 2 seconds
        }
        
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [isCanvasInitialized]);    // Manual save function
    const saveCanvas = useCallback(async () => {
        if (!fabricCanvasRef.current || !user || !boardId || !isCanvasInitialized) {
            console.log('Save cancelled: canvas not ready', {
                canvas: !!fabricCanvasRef.current,
                user: !!user,
                boardId: !!boardId,
                initialized: isCanvasInitialized
            });
            return;
        }        // Check if canvas is currently loading content (allow manual saves during loading)
        const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
        console.log('Save check - canvas loading state:', canvas._isLoadingContent);
        if (canvas._isLoadingContent) {
            console.log('Canvas is loading content, skipping save');
            return;
        }        try {
            setIsSaving(true);
            isSavingContentRef.current = true;
            const canvasJson = canvas.toJSON();
            const canvasString = JSON.stringify(canvasJson);
            
            // Don't save if content hasn't changed
            if (canvasString === lastSaveContentRef.current) {
                console.log('Canvas content unchanged, skipping save');
                setIsSaving(false);
                return;
            }

            const settings = {
                zoom: canvas.getZoom(),
                viewportTransform: canvas.viewportTransform,
                width: canvas.getWidth(),
                height: canvas.getHeight(),
                backgroundColor: canvas.backgroundColor,
            };            console.log('Saving canvas content...', { objectCount: canvasJson.objects.length });
            await saveCanvasContent(boardId, canvasJson, settings);
            lastSaveContentRef.current = canvasString;
            setLastSaveTime(new Date());
            setShowSaveToast(true);
              console.log("Canvas saved successfully at", new Date().toLocaleTimeString());
        } catch (error) {
            console.error("Failed to save canvas:", error);        } finally {
            setIsSaving(false);            // Clear the saving flag after a short delay to prevent immediate reload
            setTimeout(() => {
                isSavingContentRef.current = false;
                // Auto-focus canvas after save to ensure it's ready for drawing
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
                        
                        console.log('Canvas auto-focused and reactivated after save');
                    }
                }
            }, 1000);
        }
    }, [fabricCanvasRef, user, boardId, isCanvasInitialized, saveCanvasContent]);    // Debounced auto-save function
    const autoSave = useCallback(() => {
        // Don't auto-save if we're still loading initial content
        if (isLoadingInitialContentRef.current) {
            console.log('Skipping auto-save during initial content load');
            return;
        }

        // Don't auto-save if user is actively drawing
        if (isDrawing) {
            console.log('Skipping auto-save during active drawing');
            return;
        }

        // Check if canvas is currently loading content
        if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
            if (canvas._isLoadingContent) {
                console.log('Skipping auto-save during canvas content loading');
                return;
            }
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Auto-save after 3 seconds of inactivity
        saveTimeoutRef.current = setTimeout(() => {
            console.log('Triggering auto-save after 3 second delay');
            saveCanvas();
        }, 3000);
    }, [saveCanvas, fabricCanvasRef, isDrawing]);// Set up canvas event listeners for auto-save
    useEffect(() => {
        if (!fabricCanvasRef.current || !isCanvasInitialized) {
            return;
        }

        const canvas = fabricCanvasRef.current;        // Create stable event handlers
        const handleObjectAdded = () => {
            // Skip if actively drawing or loading
            if (isDrawing || isLoadingInitialContentRef.current) {
                console.log(`Canvas event: object:added, but skipping due to drawing: ${isDrawing}, loading: ${isLoadingInitialContentRef.current}`);
                return;
            }
            
            // Check if canvas is in a loading state
            if (fabricCanvasRef.current) {
                const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
                if (canvas._isLoadingContent) {
                    console.log('Canvas event: object:added, but skipping due to canvas loading content');
                    return;
                }
            }
            
            console.log('Canvas event: object:added, triggering auto-save');
            autoSave();
        };
        
        const handleObjectRemoved = () => {
            // Skip if actively drawing or loading
            if (isDrawing || isLoadingInitialContentRef.current) {
                console.log(`Canvas event: object:removed, but skipping due to drawing: ${isDrawing}, loading: ${isLoadingInitialContentRef.current}`);
                return;
            }
            
            // Check if canvas is in a loading state
            if (fabricCanvasRef.current) {
                const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
                if (canvas._isLoadingContent) {
                    console.log('Canvas event: object:removed, but skipping due to canvas loading content');
                    return;
                }
            }
            
            console.log('Canvas event: object:removed, triggering auto-save');
            autoSave();
        };
        
        const handleObjectModified = () => {
            // Skip if actively drawing or loading
            if (isDrawing || isLoadingInitialContentRef.current) {
                console.log(`Canvas event: object:modified, but skipping due to drawing: ${isDrawing}, loading: ${isLoadingInitialContentRef.current}`);
                return;
            }
            
            // Check if canvas is in a loading state
            if (fabricCanvasRef.current) {
                const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
                if (canvas._isLoadingContent) {
                    console.log('Canvas event: object:modified, but skipping due to canvas loading content');
                    return;
                }
            }
            
            console.log('Canvas event: object:modified, triggering auto-save');
            autoSave();
        };
        
        const handlePathCreated = () => {
            // Skip if actively drawing or loading
            if (isDrawing || isLoadingInitialContentRef.current) {
                console.log(`Canvas event: path:created, but skipping due to drawing: ${isDrawing}, loading: ${isLoadingInitialContentRef.current}`);
                return;
            }
            
            // Check if canvas is in a loading state
            if (fabricCanvasRef.current) {
                const canvas = fabricCanvasRef.current as fabric.Canvas & { _isLoadingContent?: boolean };
                if (canvas._isLoadingContent) {
                    console.log('Canvas event: path:created, but skipping due to canvas loading content');
                    return;
                }
            }
            
            console.log('Canvas event: path:created, triggering auto-save');
            autoSave();
        };

        // Add event listeners
        canvas.on('object:added', handleObjectAdded);
        canvas.on('object:removed', handleObjectRemoved);
        canvas.on('object:modified', handleObjectModified);
        canvas.on('path:created', handlePathCreated);

        // Cleanup
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            canvas.off('object:added', handleObjectAdded);
            canvas.off('object:removed', handleObjectRemoved);
            canvas.off('object:modified', handleObjectModified);
            canvas.off('path:created', handlePathCreated);
        };
    }, [fabricCanvasRef, isCanvasInitialized, autoSave, isDrawing]);

    // Save on window beforeunload (user closing/refreshing page)
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            // Force immediate save on page unload
            saveCanvas();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [saveCanvas]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);    return {
        saveCanvas,
        autoSave,
        isSaving,
        lastSaveTime,
        showSaveToast,
        setShowSaveToast,
        isSavingContentRef,
    };
};
