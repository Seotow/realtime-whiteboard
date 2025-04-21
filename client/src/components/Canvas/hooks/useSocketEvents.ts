import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { socketService } from "../../../services/socketService";
import type { FabricObjectWithId, CanvasAction, DrawEndData } from "../types/canvas";

interface UseSocketEventsProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
}

export const useSocketEvents = ({ fabricCanvasRef }: UseSocketEventsProps) => {
    const lastActionTimestamp = useRef<number>(0);
    const pendingActions = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!fabricCanvasRef.current) return;

        const canvas = fabricCanvasRef.current;        const handleCanvasAction = (action: CanvasAction) => {
            if (!canvas) return;

            // Conflict resolution: ignore actions that are too old
            const actionTime = new Date(action.timestamp).getTime();
            if (actionTime < lastActionTimestamp.current - 5000) { // Ignore actions older than 5 seconds
                console.log('Ignoring old action:', action);
                return;
            }

            // Update last action timestamp
            lastActionTimestamp.current = Math.max(lastActionTimestamp.current, actionTime);

            // Check if this action is pending (we initiated it)
            const actionKey = `${action.type}_${action.objectId}_${actionTime}`;
            if (pendingActions.current.has(actionKey)) {
                pendingActions.current.delete(actionKey);
                console.log('Skipping own action:', actionKey);
                return;
            }

            console.log('Processing remote action:', action);

            switch (action.type) {
                case "add": {
                    if (action.object) {
                        try {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            fabric.util.enlivenObjects([action.object as any], {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                reviver: function (_serializedObj: any, instance: any) {
                                    (instance as FabricObjectWithId).id = action.objectId;
                                    
                                    // Check if object already exists to prevent duplicates
                                    const existingObj = canvas.getObjects()
                                        .find((obj: FabricObjectWithId) => obj.id === action.objectId);
                                    
                                    if (!existingObj) {
                                        canvas.add(instance);
                                        canvas.renderAll();
                                        console.log('Added remote object:', action.objectId);
                                    } else {
                                        console.log('Object already exists, skipping add:', action.objectId);
                                    }
                                },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            } as any);
                        } catch (error) {
                            console.error('Failed to add remote object:', error);
                        }
                    }
                    break;
                }
                case "update": {
                    const existingObj = canvas
                        .getObjects()
                        .find((obj: FabricObjectWithId) => obj.id === action.objectId);
                    if (existingObj && action.object) {
                        // Apply optimistic update with conflict resolution
                        try {
                            existingObj.set(action.object);
                            canvas.renderAll();
                            console.log('Updated remote object:', action.objectId);
                        } catch (error) {
                            console.error('Failed to update remote object:', error);
                        }
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
                        console.log('Deleted remote object:', action.objectId);
                    }
                    break;
                }
                case "clear":
                    canvas.clear();
                    console.log('Canvas cleared by remote user');
                    break;
                default:
                    break;
            }
        };        const handleDrawEnd = (data: DrawEndData) => {
            if (data.object) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    fabric.util.enlivenObjects([data.object as any], {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        reviver: function (_serializedObj: any, instance: any) {
                            // Check for duplicates before adding
                            const existingPath = canvas.getObjects()
                                .find((obj: FabricObjectWithId) => 
                                    obj.type === 'path' && 
                                    Math.abs(obj.left! - instance.left) < 5 &&
                                    Math.abs(obj.top! - instance.top) < 5
                                );
                            
                            if (!existingPath) {
                                canvas.add(instance);
                                canvas.renderAll();
                                console.log('Added remote drawing path');
                            } else {
                                console.log('Duplicate path detected, skipping');
                            }
                        },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    } as any);
                } catch (error) {
                    console.error('Failed to add remote drawing:', error);
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
