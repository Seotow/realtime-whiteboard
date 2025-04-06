import { useEffect } from "react";
import * as fabric from "fabric";
import { socketService } from "../../../services/socketService";
import type { FabricObjectWithId, CanvasAction, DrawEndData } from "../types/canvas";

interface UseSocketEventsProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

export const useSocketEvents = ({ fabricCanvasRef }: UseSocketEventsProps) => {
    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;        const handleCanvasAction = (action: CanvasAction) => {
            if (!canvas) return;

            switch (action.type) {
                case "add": {
                    if (action.object) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            fabric.util.enlivenObjects([action.object as any], {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                reviver: function (_serializedObj: any, instance: any) {
                                    (instance as FabricObjectWithId).id = action.objectId;
                                    canvas.add(instance);
                                    canvas.renderAll();
                                },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any);
                        } catch {
                            // Object failed to add, silently handle the error
                        }
                    }
                    break;
                }
                case "update": {
                    const existingObj = canvas
                        .getObjects()
                        .find((obj: FabricObjectWithId) => obj.id === action.objectId);
                    if (existingObj && action.object) {
                        existingObj.set(action.object);
                        canvas.renderAll();
                    }
                    break;
                }
                case "delete": {
                    const objToDelete = canvas
                        .getObjects()
                        .find((obj: FabricObjectWithId) => obj.id === action.objectId);
                    if (objToDelete) {
                        canvas.remove(objToDelete);
                        canvas.renderAll();
                    }
                    break;
                }
                case "clear":
                    canvas.clear();
                    break;
                default:
                    break;
            }
        };

        const handleDrawEnd = (data: DrawEndData) => {
            if (data.object) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    fabric.util.enlivenObjects([data.object as any], {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        reviver: function (_serializedObj: any, instance: any) {
                            canvas.add(instance);
                            canvas.renderAll();                        },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any);
                } catch {
                    // Object failed to add, silently handle the error
                }
            }
        };

        socketService.on("canvas:action", handleCanvasAction);
        socketService.on("draw:end", handleDrawEnd);

        return () => {
            socketService.off("canvas:action", handleCanvasAction);
            socketService.off("draw:end", handleDrawEnd);
        };
    }, [fabricCanvasRef]);
};
