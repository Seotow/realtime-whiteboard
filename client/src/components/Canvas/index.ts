// Export the main canvas component
export { Canvas } from "./Canvas";

// Export types for external use
export type { 
    CanvasProps, 
    ToolType, 
    BrushType, 
    ShapeType,
    CanvasAction,
    User
} from "./types/canvas";

// Export constants
export { 
    PRESET_COLORS,
    DEFAULT_CANVAS_CONFIG,
    DEFAULT_BRUSH_CONFIG
} from "./constants/config";

// Export utility functions
export { createToolCursor, getCanvasClasses } from "./utils/cursor";
export { createShape, createText, createLine, createArrow } from "./utils/shapes";

// Export components
export { CanvasToolbar } from "./components/CanvasToolbar";
export { CanvasInstructions } from "./components/CanvasInstructions";

// Export hooks for advanced usage
export { useCanvasInitialization } from "./hooks/useCanvasInitialization";
export { useCanvasHistory } from "./hooks/useCanvasHistory";
export { useCanvasEventHandlers } from "./hooks/useCanvasEventHandlers";
export { useCanvasCursor } from "./hooks/useCanvasCursor";
export { useZoomControls } from "./hooks/useZoomControls";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useCanvasActions } from "./hooks/useCanvasActions";
export { useSocketEvents } from "./hooks/useSocketEvents";
export { useCanvasToolConfiguration } from "./hooks/useCanvasToolConfiguration";
