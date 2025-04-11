import React from "react";
import {
    Pencil,
    MousePointer,
    Square,
    Circle,
    Triangle,
    Type,
    Eraser,
    Trash2,
    Download,
    Upload,
    RotateCcw,
    RotateCw,
    ZoomIn,
    ZoomOut,
    Home,
    Minus,
    ArrowRight,
    Save,
} from "lucide-react";
import { PRESET_COLORS } from "../constants/config";
import type { ToolType, BrushType, ShapeType } from "../types/canvas";

interface CanvasToolbarProps {
    currentTool: ToolType;
    brushColor: string;
    brushSize: number;
    brushType: BrushType;
    opacity: number;
    zoom: number;
    showColorPicker: boolean;
    setCurrentTool: (tool: ToolType) => void;
    setBrushColor: (color: string) => void;
    setBrushSize: (size: number) => void;
    setBrushType: (type: BrushType) => void;
    setOpacity: (opacity: number) => void;
    setShowColorPicker: (show: boolean) => void;
    addShape: (shape: ShapeType) => void;
    addText: () => void;
    addLine: () => void;
    addArrow: () => void;
    handleUndo: () => void;
    handleRedo: () => void;
    clearCanvas: () => void;
    handleZoomIn: () => void;
    handleZoomOut: () => void;    handleZoomReset: () => void;
    handleImport: () => void;
    handleExport: () => void;
    handleSave?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    currentTool,
    brushColor,
    brushSize,
    brushType,
    opacity,
    zoom,
    showColorPicker,
    setCurrentTool,
    setBrushColor,
    setBrushSize,
    setBrushType,
    setOpacity,
    setShowColorPicker,
    addShape,
    addText,
    addLine,
    addArrow,
    handleUndo,
    handleRedo,
    clearCanvas,
    handleZoomIn,
    handleZoomOut,    handleZoomReset,
    handleImport,
    handleExport,
    handleSave,
}) => {
    return (
        <div className="canvas-toolbar">
            {/* Drawing Tools */}
            <div className="tool-group">
                <button
                    className={`tool-btn ${currentTool === "pen" ? "active" : ""}`}
                    onClick={() => setCurrentTool("pen")}
                    title="Pen Tool (P)">
                    <Pencil size={20} />
                </button>
                <button
                    className={`tool-btn ${currentTool === "eraser" ? "active" : ""}`}
                    onClick={() => setCurrentTool("eraser")}
                    title="Eraser Tool (E)">
                    <Eraser size={20} />
                </button>
                <button
                    className={`tool-btn ${currentTool === "select" ? "active" : ""}`}
                    onClick={() => setCurrentTool("select")}
                    title="Select Tool (V)">
                    <MousePointer size={20} />
                </button>
            </div>

            {/* Color and Brush Settings */}
            <div className="tool-group">
                <div className="color-picker-container">
                    <button
                        className="color-picker-btn"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        style={{ backgroundColor: brushColor }}
                        title="Color Picker"
                    />
                    {showColorPicker && (
                        <div className="color-picker-dropdown">
                            <div className="preset-colors">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        className={`color-preset ${
                                            brushColor === color ? "active" : ""
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                            setBrushColor(color);
                                            setShowColorPicker(false);
                                        }}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                className="custom-color-input"
                            />
                        </div>
                    )}
                </div>

                <div className="brush-size-container">
                    <label className="brush-size-label">Size</label>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="brush-size-slider"
                    />
                    <span className="brush-size-value">{brushSize}px</span>
                </div>

                <div className="brush-type-container">
                    <label className="brush-type-label">Brush</label>
                    <select
                        value={brushType}
                        onChange={(e) => setBrushType(e.target.value as BrushType)}
                        className="brush-type-select">
                        <option value="pencil">Pencil</option>
                        <option value="circle">Circle</option>
                        <option value="spray">Spray</option>
                    </select>
                </div>

                <div className="opacity-container">
                    <label className="opacity-label">Opacity</label>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        className="opacity-slider"
                    />
                    <span className="opacity-value">{Math.round(opacity * 100)}%</span>
                </div>
            </div>

            {/* Shape Tools */}
            <div className="tool-group">
                <button
                    onClick={() => addShape("rectangle")}
                    className="tool-btn"
                    title="Add Rectangle">
                    <Square size={20} />
                </button>
                <button
                    onClick={() => addShape("circle")}
                    className="tool-btn"
                    title="Add Circle">
                    <Circle size={20} />
                </button>
                <button
                    onClick={() => addShape("triangle")}
                    className="tool-btn"
                    title="Add Triangle">
                    <Triangle size={20} />
                </button>
                <button onClick={addLine} className="tool-btn" title="Add Line">
                    <Minus size={20} />
                </button>
                <button onClick={addArrow} className="tool-btn" title="Add Arrow">
                    <ArrowRight size={20} />
                </button>
                <button onClick={addText} className="tool-btn" title="Add Text">
                    <Type size={20} />
                </button>
            </div>

            {/* Action Tools */}
            <div className="tool-group">
                <button onClick={handleUndo} className="tool-btn" title="Undo (Ctrl+Z)">
                    <RotateCcw size={20} />
                </button>
                <button onClick={handleRedo} className="tool-btn" title="Redo (Ctrl+Y)">
                    <RotateCw size={20} />
                </button>
                <button
                    onClick={clearCanvas}
                    className="tool-btn danger"
                    title="Clear Canvas">
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Zoom Controls */}
            <div className="tool-group">
                <button onClick={handleZoomOut} className="tool-btn" title="Zoom Out">
                    <ZoomOut size={20} />
                </button>
                <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                <button onClick={handleZoomIn} className="tool-btn" title="Zoom In">
                    <ZoomIn size={20} />
                </button>
                <button onClick={handleZoomReset} className="tool-btn" title="Reset Zoom">
                    <Home size={20} />
                </button>
            </div>            {/* File Operations */}
            <div className="tool-group">
                {handleSave && (
                    <button onClick={handleSave} className="tool-btn" title="Save Canvas (Ctrl+S)">
                        <Save size={20} />
                    </button>
                )}
                <button onClick={handleImport} className="tool-btn" title="Import Image">
                    <Upload size={20} />
                </button>
                <button onClick={handleExport} className="tool-btn" title="Export as PNG">
                    <Download size={20} />
                </button>
            </div>
        </div>
    );
};
