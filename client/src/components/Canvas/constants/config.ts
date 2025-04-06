export const PRESET_COLORS = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
    "#FFC0CB",
    "#A52A2A",
    "#808080",
    "#000080",
    "#008000",
];

export const DEFAULT_CANVAS_CONFIG = {
    width: 1920,
    height: 1080,
    backgroundColor: "#ffffff",
    selection: false,
    preserveObjectStacking: true,
};

export const DEFAULT_BRUSH_CONFIG = {
    color: "#000000",
    size: 2,
    type: "pencil" as const,
    opacity: 1,
};

export const ZOOM_CONFIG = {
    min: 0.01,
    max: 20,
    factor: 1.1,
    wheelSensitivity: 0.999,
};

export const HISTORY_CONFIG = {
    maxStates: 20,
};

export const CURSOR_CONFIG = {
    size: 32,
    center: 16,
};

export const BRUSH_SIZE_CONFIG = {
    min: 1,
    max: 50,
    sensitivity: 0.5,
};
