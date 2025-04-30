import * as fabric from "fabric";
import type { FabricObjectWithId, ShapeType } from "../types/canvas";

export const createShape = (
    shapeType: ShapeType,
    brushColor: string,
    opacity: number,
    centerX?: number,
    centerY?: number
): FabricObjectWithId => {
    let shape: fabric.FabricObject;

    // Use provided center or fallback to default position
    const posX = centerX !== undefined ? centerX - 50 : 100; // 50 is half of default width/radius
    const posY = centerY !== undefined ? centerY - 50 : 100;

    switch (shapeType) {
        case "rectangle":
            shape = new fabric.Rect({
                left: posX,
                top: posY,
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
                left: posX,
                top: posY,
                radius: 50,
                fill: brushColor,
                stroke: "#000",
                strokeWidth: 1,
                opacity,
            });
            break;
        case "triangle":
            shape = new fabric.Triangle({
                left: posX,
                top: posY,
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

export const createText = (
    brushColor: string, 
    opacity: number,
    centerX?: number,
    centerY?: number
): FabricObjectWithId => {
    // Use provided center or fallback to default position
    const posX = centerX !== undefined ? centerX - 50 : 100; // Approximate text width offset
    const posY = centerY !== undefined ? centerY - 10 : 100; // Half of default font size

    const text = new fabric.IText("Type here...", {
        left: posX,
        top: posY,
        fontSize: 20,
        fill: brushColor,
        opacity,
    });

    (text as FabricObjectWithId).id = Date.now().toString();
    return text as FabricObjectWithId;
};

export const createLine = (
    brushColor: string, 
    brushSize: number, 
    opacity: number,
    centerX?: number,
    centerY?: number
): FabricObjectWithId => {
    // Use provided center or fallback to default position
    const posX = centerX !== undefined ? centerX : 125;
    const posY = centerY !== undefined ? centerY : 100;
    
    // Create a horizontal line centered on the position
    const lineStart = posX - 75; // 150px line length, so start 75px before center
    const lineEnd = posX + 75;

    const line = new fabric.Line([lineStart, posY, lineEnd, posY], {
        stroke: brushColor,
        strokeWidth: brushSize,
        opacity,
    });

    (line as FabricObjectWithId).id = Date.now().toString();
    return line as FabricObjectWithId;
};

export const createArrow = (
    brushColor: string, 
    brushSize: number, 
    opacity: number,
    centerX?: number,
    centerY?: number
): FabricObjectWithId => {
    // Use provided center or fallback to default position
    const posX = centerX !== undefined ? centerX - 40 : 100; // 80px arrow width, so offset by 40px
    const posY = centerY !== undefined ? centerY : 100;

    const arrowPath = "M 0 0 L 80 0 M 70 -5 L 80 0 L 70 5";
    const arrow = new fabric.Path(arrowPath, {
        left: posX,
        top: posY,
        stroke: brushColor,
        strokeWidth: brushSize,
        fill: "",
        opacity,
    });

    (arrow as FabricObjectWithId).id = Date.now().toString();
    return arrow as FabricObjectWithId;
};
