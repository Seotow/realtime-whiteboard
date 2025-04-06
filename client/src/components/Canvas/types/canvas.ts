import * as fabric from "fabric";

export interface CanvasProps {
    boardId: string;
    width?: number;
    height?: number;
}

export interface FabricObjectWithId extends fabric.FabricObject {
    id?: string;
}

export type ToolType = "pen" | "eraser" | "select" | "line" | "arrow";
export type BrushType = "pencil" | "circle" | "spray";
export type ShapeType = "rectangle" | "circle" | "triangle";

export interface PathCreatedEvent {
    path: FabricObjectWithId;
}

export interface ObjectModifiedEvent {
    target: FabricObjectWithId;
    e: Event;
}

export interface SelectionCreatedEvent {
    selected: FabricObjectWithId[];
}

export interface CanvasAction {
    type: "add" | "update" | "delete" | "clear";
    object?: Record<string, unknown>;
    objectId?: string;
    boardId: string;
    userId: string;
    timestamp: Date;
}

export interface User {
    id: string;
    username?: string;
    email?: string;
}

export interface DrawEndData {
    object?: Record<string, unknown>;
}

export interface CanvasState {
    currentTool: ToolType;
    brushColor: string;
    brushSize: number;
    brushType: BrushType;
    zoom: number;
    showColorPicker: boolean;
    isDrawing: boolean;
    opacity: number;
    isPanning: boolean;
    lastPanPoint: { x: number; y: number } | null;
    isSpacePressed: boolean;
    isAltPressed: boolean;
    canvasInitialized: boolean;
    isAdjustingBrushSize: boolean;
    lastBrushAdjustX: number | null;
    canvasHistory: string[];
    historyIndex: number;
}
