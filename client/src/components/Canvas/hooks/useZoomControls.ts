import { useCallback } from "react";
import * as fabric from "fabric";
import { ZOOM_CONFIG } from "../constants/config";

interface UseZoomControlsProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    zoom: number;
    setZoom: (zoom: number) => void;
    isAltPressed: boolean;
}

export const useZoomControls = ({
    fabricCanvasRef,
    zoom,
    setZoom,
    isAltPressed,
}: UseZoomControlsProps) => {
    const handleZoomIn = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const newZoom = Math.min(zoom * ZOOM_CONFIG.factor, ZOOM_CONFIG.max);
        setZoom(newZoom);
        canvas.setZoom(newZoom);
        canvas.renderAll();
    }, [fabricCanvasRef, zoom, setZoom]);

    const handleZoomOut = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const newZoom = Math.max(zoom / ZOOM_CONFIG.factor, ZOOM_CONFIG.min);
        setZoom(newZoom);
        canvas.setZoom(newZoom);
        canvas.renderAll();
    }, [fabricCanvasRef, zoom, setZoom]);

    const handleZoomReset = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        setZoom(1);
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
    }, [fabricCanvasRef, setZoom]);

    const handleWheel = useCallback(
        (e: fabric.TEvent<WheelEvent>) => {
            if (!fabricCanvasRef.current) return;

            const canvas = fabricCanvasRef.current;
            const delta = e.e.deltaY;
            let currentZoom = canvas.getZoom();

            if (isAltPressed || e.e.ctrlKey) {
                e.e.preventDefault();
                e.e.stopPropagation();

                currentZoom *= ZOOM_CONFIG.wheelSensitivity ** delta;
                if (currentZoom > ZOOM_CONFIG.max) currentZoom = ZOOM_CONFIG.max;
                if (currentZoom < ZOOM_CONFIG.min) currentZoom = ZOOM_CONFIG.min;

                const pointer = canvas.getPointer(e.e);
                canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), currentZoom);
                setZoom(currentZoom);
                return false;
            }

            return true;
        },
        [fabricCanvasRef, isAltPressed, setZoom]
    );

    return {
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        handleWheel,
    };
};
