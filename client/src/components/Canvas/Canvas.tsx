import React, { useRef, useState } from "react";
import { useBoardStore } from "../../stores/boardStore";
import { useAuthStore } from "../../stores/authStore";
import { getCanvasClasses } from "./utils/cursor";
import { DEFAULT_CANVAS_CONFIG, DEFAULT_BRUSH_CONFIG } from "./constants/config";
import type { CanvasProps, ToolType, BrushType } from "./types/canvas";

// Components
import { CanvasToolbar } from "./components/CanvasToolbar";
import { CanvasInstructions } from "./components/CanvasInstructions";
import { SaveStatus } from "./components/SaveStatus";
import { SaveToast } from "./components/SaveToast";

// Hooks
import { useCanvasInitialization } from "./hooks/useCanvasInitialization";
import { useCanvasHistory } from "./hooks/useCanvasHistory";
import { useCanvasEventHandlers } from "./hooks/useCanvasEventHandlers";
import { useCanvasCursor } from "./hooks/useCanvasCursor";
import { useZoomControls } from "./hooks/useZoomControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasActions } from "./hooks/useCanvasActions";
import { useSocketEvents } from "./hooks/useSocketEvents";
import { useCanvasToolConfiguration } from "./hooks/useCanvasToolConfiguration";
import { useCanvasAutoSave } from "./hooks/useCanvasAutoSave";
import { useCanvasFocus } from "./hooks/useCanvasFocus";
import { useRealtimeCollaboration } from "./hooks/useRealtimeCollaboration";

import "../../styles/canvas.css";

export const Canvas: React.FC<CanvasProps> = ({
    boardId,
    width = DEFAULT_CANVAS_CONFIG.width,
    height = DEFAULT_CANVAS_CONFIG.height,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fabricCanvasRef = useRef<any>(null);
    const isAdjustingBrushSizeRef = useRef(false);

    // State
    const [currentTool, setCurrentTool] = useState<ToolType>("pen");
    const [brushColor, setBrushColor] = useState(DEFAULT_BRUSH_CONFIG.color);
    const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_CONFIG.size);
    const [brushType, setBrushType] = useState<BrushType>(DEFAULT_BRUSH_CONFIG.type);
    const [zoom, setZoom] = useState(1);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [opacity, setOpacity] = useState(DEFAULT_BRUSH_CONFIG.opacity);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isAltPressed, setIsAltPressed] = useState(false);    const [canvasInitialized, setCanvasInitialized] = useState(false);
    const [isAdjustingBrushSize, setIsAdjustingBrushSize] = useState(false);
    const [lastBrushAdjustX, setLastBrushAdjustX] = useState<number | null>(null);

    // Store hooks
    const { currentBoard, emitCanvasAction } = useBoardStore();
    const { user } = useAuthStore();    // Canvas history hook
    const { saveCanvasState, handleUndo, handleRedo } = useCanvasHistory({
        fabricCanvasRef,
    });    // Auto-save functionality
    const { saveCanvas, isSaving, lastSaveTime, showSaveToast, setShowSaveToast, isSavingContentRef } = useCanvasAutoSave({
        fabricCanvasRef,
        boardId,
        isCanvasInitialized: canvasInitialized,
        isDrawing,
    });    // Canvas focus management
    const { focusCanvas } = useCanvasFocus({
        fabricCanvasRef,
        isCanvasInitialized: canvasInitialized,
    });    // Real-time collaboration
    const { remoteCursors } = useRealtimeCollaboration({
        fabricCanvasRef,
        boardId,
        isCanvasInitialized: canvasInitialized,
    });

    // Log remote cursors for debugging (will be rendered by useRealtimeCollaboration)
    React.useEffect(() => {
        if (remoteCursors.length > 0) {
            console.log(`${remoteCursors.length} remote cursor(s) active`);
        }
    }, [remoteCursors]);

    // Additional focus management for specific scenarios
    React.useEffect(() => {
        // Focus canvas when component mounts and becomes ready
        if (canvasInitialized && canvasRef.current && fabricCanvasRef.current) {
            const timer = setTimeout(() => {
                canvasRef.current?.focus();
                focusCanvas();
                
                // Additional activation step - ensure drawing mode is really active
                const canvas = fabricCanvasRef.current;
                if (canvas && canvas.isDrawingMode) {
                    canvas.setCursor(canvas.freeDrawingCursor || 'crosshair');
                    
                    // Force the canvas to respond to mouse events immediately
                    const canvasElement = canvas.getElement();
                    if (canvasElement) {
                        const rect = canvasElement.getBoundingClientRect();
                        const event = new MouseEvent('mousemove', {
                            clientX: rect.left + rect.width / 2,
                            clientY: rect.top + rect.height / 2,
                            bubbles: true
                        });
                        canvasElement.dispatchEvent(event);
                    }
                }
                
                console.log('Canvas focused and activated on component ready');
            }, 100);
            
            return () => clearTimeout(timer);
        }
    }, [canvasInitialized, focusCanvas]);

    // Focus canvas when page becomes visible (user switches back to tab)
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && canvasInitialized) {
                setTimeout(() => {
                    canvasRef.current?.focus();
                    focusCanvas();
                    console.log('Canvas focused on page visibility change');
                }, 100);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [canvasInitialized, focusCanvas]);

    // Initialize canvas
    useCanvasInitialization(
        canvasRef,
        fabricCanvasRef,
        width,
        height,
        currentBoard?.content,
        saveCanvasState,
        setCanvasInitialized,
        isDrawing,
        isSavingContentRef
    );

    const { updateCursor } = useCanvasCursor({
        fabricCanvasRef,
        isAdjustingBrushSize,
        isSpacePressed,
        currentTool,
        brushColor,
    });

    const { handleZoomIn, handleZoomOut, handleZoomReset, handleWheel } = useZoomControls({
        fabricCanvasRef,
        zoom,
        setZoom,
        isAltPressed,
    });

    const { handlePathCreated, handleObjectModified, handleSelectionCreated, handleMouseMove, handleMouseDown, handleMouseUp } = 
        useCanvasEventHandlers({
            user,
            boardId,
            emitCanvasAction,
            saveCanvasState,
            isPanning,
            isAdjustingBrushSize,
            isSpacePressed,
            setIsDrawing,
            setIsPanning,
            setLastPanPoint,
            setBrushSize,
            setLastBrushAdjustX,
            setIsAdjustingBrushSize,
            isAdjustingBrushSizeRef,
            lastPanPoint,
            lastBrushAdjustX,
            currentTool,
            isAltPressed,
            updateCursor,
        });

    const { addShape, addText, addLine, addArrow, clearCanvas, handleExport, handleImport } = 
        useCanvasActions({
            fabricCanvasRef,
            user,
            boardId,
            brushColor,
            brushSize,
            opacity,
            currentBoard,
            emitCanvasAction,
            saveCanvasState,
        });    // Effect hooks
    useSocketEvents({ fabricCanvasRef });    useCanvasToolConfiguration({
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
    });useKeyboardShortcuts({
        fabricCanvasRef,
        boardId,
        user,
        emitCanvasAction,
        handleUndo,
        handleRedo,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        handleSave: saveCanvas,
        isPanning,
        isAltPressed,
        currentTool,
        setIsSpacePressed,
        setIsAltPressed,
        setCurrentTool,
        setShowColorPicker,
    });

    // Event handlers setup
    React.useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedHandlePathCreated = (e: any) => handlePathCreated(e, canvas);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedHandleMouseMove = (e: any) => handleMouseMove(e, canvas);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedHandleMouseDown = (e: any) => handleMouseDown(e, canvas);
        const wrappedHandleMouseUp = () => handleMouseUp(canvas);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedHandleObjectModified = (e: any) => handleObjectModified(e);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wrappedHandleSelectionCreated = (e: any) => handleSelectionCreated(e);

        canvas.on("path:created", wrappedHandlePathCreated);
        canvas.on("object:modified", wrappedHandleObjectModified);
        canvas.on("selection:created", wrappedHandleSelectionCreated);
        canvas.on("mouse:move", wrappedHandleMouseMove);
        canvas.on("mouse:down", wrappedHandleMouseDown);
        canvas.on("mouse:up", wrappedHandleMouseUp);
        canvas.on("mouse:wheel", handleWheel);

        return () => {
            canvas.off("path:created", wrappedHandlePathCreated);
            canvas.off("object:modified", wrappedHandleObjectModified);
            canvas.off("selection:created", wrappedHandleSelectionCreated);
            canvas.off("mouse:move", wrappedHandleMouseMove);
            canvas.off("mouse:down", wrappedHandleMouseDown);
            canvas.off("mouse:up", wrappedHandleMouseUp);
            canvas.off("mouse:wheel", handleWheel);
        };
    }, [
        fabricCanvasRef,
        handlePathCreated,
        handleObjectModified,
        handleSelectionCreated,
        handleMouseMove,
        handleMouseDown,
        handleMouseUp,
        handleWheel,
    ]);    return (
        <div 
            className={`relative ${getCanvasClasses(isDrawing, isPanning, isSpacePressed, isAdjustingBrushSize, currentTool)}`}
            onMouseEnter={() => {
                if (canvasInitialized && canvasRef.current) {
                    canvasRef.current.focus();
                    focusCanvas();
                }
            }}
        >
            <canvas 
                ref={canvasRef} 
                tabIndex={0}
                style={{ outline: 'none' }}
                onFocus={() => {
                    console.log('Canvas focused via onFocus event');
                    focusCanvas();
                }}
                onMouseEnter={() => {
                    if (canvasInitialized) {
                        canvasRef.current?.focus();
                        focusCanvas();
                    }
                }}
                onMouseDown={() => {
                    if (canvasInitialized) {
                        canvasRef.current?.focus();
                        focusCanvas();
                    }
                }}
            />            {/* Save Status Indicator */}
            <SaveStatus
                isSaving={isSaving}
                lastSaveTime={lastSaveTime}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-gray-200/50 z-50 transition-all duration-300"
            />

            {/* Save Success Toast */}
            <SaveToast
                show={showSaveToast}
                onHide={() => setShowSaveToast(false)}
                message="Canvas auto-saved"
            />
            
            <CanvasToolbar
                currentTool={currentTool}
                brushColor={brushColor}
                brushSize={brushSize}
                brushType={brushType}
                opacity={opacity}
                zoom={zoom}
                showColorPicker={showColorPicker}
                setCurrentTool={setCurrentTool}
                setBrushColor={setBrushColor}
                setBrushSize={setBrushSize}
                setBrushType={setBrushType}
                setOpacity={setOpacity}
                setShowColorPicker={setShowColorPicker}
                addShape={addShape}
                addText={addText}
                addLine={addLine}
                addArrow={addArrow}
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                clearCanvas={clearCanvas}
                handleZoomIn={handleZoomIn}
                handleZoomOut={handleZoomOut}                handleZoomReset={handleZoomReset}                handleImport={handleImport}
                handleExport={handleExport}
                handleSave={saveCanvas}
            />

            <CanvasInstructions
                isAdjustingBrushSize={isAdjustingBrushSize}
                currentTool={currentTool}
                brushSize={brushSize}
                brushColor={brushColor}
            />
        </div>
    );
};
