import * as fabric from "fabric";
import type { FabricObjectWithId, ShapeType } from "../types/canvas";

export const createShape = (
    shapeType: ShapeType,
    brushColor: string,
    opacity: number
): FabricObjectWithId => {
    let shape: fabric.FabricObject;

    switch (shapeType) {
        case "rectangle":
            shape = new fabric.Rect({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: brushColor,
                stroke: "#000",
                strokeWidth: 1,
                opacity,
            });
            break;
        case "circle":
            shape = new fabric.Circle({
                left: 100,
                top: 100,
                radius: 50,
                fill: brushColor,
                stroke: "#000",
                strokeWidth: 1,
                opacity,
            });
            break;
        case "triangle":
            shape = new fabric.Triangle({
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                fill: brushColor,
                stroke: "#000",
                strokeWidth: 1,
                opacity,
            });
            break;
        default:
            throw new Error(`Unknown shape type: ${shapeType}`);
    }

    (shape as FabricObjectWithId).id = Date.now().toString();
    return shape as FabricObjectWithId;
};

export const createText = (brushColor: string, opacity: number): FabricObjectWithId => {
    const text = new fabric.IText("Type here...", {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: brushColor,
        opacity,
    });

    (text as FabricObjectWithId).id = Date.now().toString();
    return text as FabricObjectWithId;
};

export const createLine = (brushColor: string, brushSize: number, opacity: number): FabricObjectWithId => {
    const line = new fabric.Line([50, 100, 200, 100], {
        stroke: brushColor,
        strokeWidth: brushSize,
        opacity,
    });

    (line as FabricObjectWithId).id = Date.now().toString();
    return line as FabricObjectWithId;
};

export const createArrow = (brushColor: string, brushSize: number, opacity: number): FabricObjectWithId => {
    const arrowPath = "M 0 0 L 80 0 M 70 -5 L 80 0 L 70 5";
    const arrow = new fabric.Path(arrowPath, {
        left: 100,
        top: 100,
        stroke: brushColor,
        strokeWidth: brushSize,
        fill: "",
        opacity,
    });

    (arrow as FabricObjectWithId).id = Date.now().toString();
    return arrow as FabricObjectWithId;
};
