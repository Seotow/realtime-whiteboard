import { useCallback } from "react";
import * as fabric from "fabric";
import { createShape, createText, createLine, createArrow } from "../utils/shapes";
import type { ShapeType, CanvasAction, User } from "../types/canvas";

interface UseCanvasActionsProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    user: User | null;
    boardId: string;
    brushColor: string;
    brushSize: number;
    opacity: number;
    currentBoard: { title?: string } | null;
    emitCanvasAction: (action: CanvasAction) => void;
    saveCanvasState: () => void;
}

export const useCanvasActions = ({
    fabricCanvasRef,
    user,
    boardId,
    brushColor,
    brushSize,
    opacity,
    currentBoard,
    emitCanvasAction,
    saveCanvasState,
}: UseCanvasActionsProps) => {    const addShape = useCallback(
        (shapeType: ShapeType) => {
            if (!fabricCanvasRef.current || !user) return;

            const canvas = fabricCanvasRef.current;
            
            // Get the center of the current viewport (visible area)
            const zoom = canvas.getZoom();
            const viewportTransform = canvas.viewportTransform!;
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            
            // Calculate the center of the visible area
            const visibleCenterX = (canvasWidth / 2 - viewportTransform[4]) / zoom;
            const visibleCenterY = (canvasHeight / 2 - viewportTransform[5]) / zoom;
            
            const shape = createShape(
                shapeType, 
                brushColor, 
                opacity,
                visibleCenterX,
                visibleCenterY
            );

            canvas.add(shape);
            saveCanvasState();

            emitCanvasAction({
                type: "add",
                objectId: shape.id!,
                object: shape.toObject() as unknown as Record<string, unknown>,
                boardId,
                userId: user.id,
                timestamp: new Date(),
            });
        },
        [fabricCanvasRef, user, brushColor, opacity, boardId, emitCanvasAction, saveCanvasState]
    );    const addText = useCallback(() => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        
        // Get the center of the current viewport (visible area)
        const zoom = canvas.getZoom();
        const viewportTransform = canvas.viewportTransform!;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // Calculate the center of the visible area
        const visibleCenterX = (canvasWidth / 2 - viewportTransform[4]) / zoom;
        const visibleCenterY = (canvasHeight / 2 - viewportTransform[5]) / zoom;
        
        const text = createText(
            brushColor, 
            opacity,
            visibleCenterX,
            visibleCenterY
        );

        canvas.add(text);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: text.id!,
            object: text.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    }, [fabricCanvasRef, user, brushColor, opacity, boardId, emitCanvasAction, saveCanvasState]);    const addLine = useCallback(() => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        
        // Get the center of the current viewport (visible area)
        const zoom = canvas.getZoom();
        const viewportTransform = canvas.viewportTransform!;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // Calculate the center of the visible area
        const visibleCenterX = (canvasWidth / 2 - viewportTransform[4]) / zoom;
        const visibleCenterY = (canvasHeight / 2 - viewportTransform[5]) / zoom;
        
        const line = createLine(
            brushColor, 
            brushSize, 
            opacity,
            visibleCenterX,
            visibleCenterY
        );

        canvas.add(line);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: line.id!,
            object: line.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    }, [fabricCanvasRef, user, brushColor, brushSize, opacity, boardId, emitCanvasAction, saveCanvasState]);    const addArrow = useCallback(() => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        
        // Get the center of the current viewport (visible area)
        const zoom = canvas.getZoom();
        const viewportTransform = canvas.viewportTransform!;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // Calculate the center of the visible area
        const visibleCenterX = (canvasWidth / 2 - viewportTransform[4]) / zoom;
        const visibleCenterY = (canvasHeight / 2 - viewportTransform[5]) / zoom;
        
        const arrow = createArrow(
            brushColor, 
            brushSize, 
            opacity,
            visibleCenterX,
            visibleCenterY
        );

        canvas.add(arrow);
        saveCanvasState();

        emitCanvasAction({
            type: "add",
            objectId: arrow.id!,
            object: arrow.toObject() as unknown as Record<string, unknown>,
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    }, [fabricCanvasRef, user, brushColor, brushSize, opacity, boardId, emitCanvasAction, saveCanvasState]);

    const clearCanvas = useCallback(() => {
        if (!fabricCanvasRef.current || !user) return;

        const canvas = fabricCanvasRef.current;
        canvas.clear();
        saveCanvasState();

        emitCanvasAction({
            type: "clear",
            boardId,
            userId: user.id,
            timestamp: new Date(),
        });
    }, [fabricCanvasRef, user, boardId, emitCanvasAction, saveCanvasState]);

    const handleExport = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const dataURL = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 1,
        });

        const link = document.createElement("a");
        link.download = `${currentBoard?.title || "whiteboard"}.png`;
        link.href = dataURL;
        link.click();
    }, [fabricCanvasRef, currentBoard?.title]);

    const handleImport = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && fabricCanvasRef.current) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imgUrl = event.target?.result as string;
                    fabric.FabricImage.fromURL(imgUrl, {
                        crossOrigin: "anonymous",
                    }).then((img) => {
                        if (fabricCanvasRef.current) {
                            img.scale(0.5);
                            fabricCanvasRef.current.add(img);
                            fabricCanvasRef.current.renderAll();
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }, [fabricCanvasRef]);

    return {
        addShape,
        addText,
        addLine,
        addArrow,
        clearCanvas,
        handleExport,
        handleImport,
    };
};
