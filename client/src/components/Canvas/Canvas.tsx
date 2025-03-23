import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useBoardStore } from '../../stores/boardStore';
import { socketService } from '../../services/socketService';
import { useAuthStore } from '../../stores/authStore';
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
  ArrowRight
} from 'lucide-react';
import '../../styles/canvas.css';

interface CanvasProps {
  boardId: string;
  width?: number;
  height?: number;
}

interface FabricObjectWithId extends fabric.FabricObject {
  id?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ 
  boardId, 
  width = 1920, 
  height = 1080 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'select' | 'line' | 'arrow'>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [brushType, setBrushType] = useState<'pencil' | 'circle' | 'spray'>('pencil');
  const [zoom, setZoom] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [isPanning, setIsPanning] = useState(false);  const [lastPanPoint, setLastPanPoint] = useState<{x: number, y: number} | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [canvasInitialized, setCanvasInitialized] = useState(false);

  const { currentBoard, emitCanvasAction } = useBoardStore();
  const { user } = useAuthStore();

  // Predefined colors
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  // History management for undo/redo
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Save canvas state to history
  const saveCanvasState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const canvasJson = JSON.stringify(canvas.toJSON());
    
    setCanvasHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(canvasJson);
      return newHistory.slice(-20); // Keep only last 20 states
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);
  // Event handlers using useCallback to prevent re-creation
  const handlePathCreated = useCallback((e: any) => {
    if (!e.path || !user) return;

    const pathData = e.path.toObject() as unknown as Record<string, unknown>;
    const pathObject = e.path as FabricObjectWithId;
    pathObject.id = pathObject.id || Date.now().toString();
    
    setIsDrawing(false);
    saveCanvasState();
    
    emitCanvasAction({
      type: 'add',
      objectId: pathObject.id,
      object: pathData,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });

    socketService.emitDrawEnd({
      boardId,
      object: pathData
    });
  }, [user, boardId, emitCanvasAction, saveCanvasState]);

  const handleObjectModified = useCallback((e: any) => {
    if (!e.target || !user) return;

    const objectData = e.target.toObject() as unknown as Record<string, unknown>;
    const targetObject = e.target as FabricObjectWithId;
    
    saveCanvasState();
    
    emitCanvasAction({
      type: 'update',
      objectId: targetObject.id || Date.now().toString(),
      object: objectData,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  }, [user, boardId, emitCanvasAction, saveCanvasState]);

  const handleSelectionCreated = useCallback((e: any) => {
    if (!e.selected || !user) return;

    const selectedIds = e.selected.map((obj: FabricObjectWithId) => obj.id || '').filter(Boolean);
    socketService.emitSelectionChange({
      objects: selectedIds,
      boardId
    });
  }, [user, boardId]);

  const handleMouseMove = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!user || !fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(e.e);
    
    // Handle panning
    if (isPanning && lastPanPoint) {
      const vpt = canvas.viewportTransform;
      if (vpt) {
        vpt[4] += pointer.x - lastPanPoint.x;
        vpt[5] += pointer.y - lastPanPoint.y;
        canvas.requestRenderAll();
      }
      setLastPanPoint({ x: pointer.x, y: pointer.y });
      return;
    }

    // Emit cursor position for other users
    socketService.emitCursorMove({
      x: pointer.x,
      y: pointer.y,
      boardId
    });
  }, [user, boardId, isPanning, lastPanPoint]);

  const handleMouseDown = useCallback((e: fabric.TEvent<fabric.TPointerEvent>) => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    
    // Handle panning with space key first
    if (isSpacePressed || (e.e as MouseEvent).button === 1) {
      e.e.preventDefault();
      setIsPanning(true);
      const pointer = canvas.getPointer(e.e);
      setLastPanPoint({ x: pointer.x, y: pointer.y });
      canvas.selection = false;
      canvas.defaultCursor = 'grabbing';
      canvas.hoverCursor = 'grabbing';
      return false;
    }
    
    setIsDrawing(true);
  }, [isSpacePressed]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    
    if (isPanning && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      setIsPanning(false);
      setLastPanPoint(null);
      canvas.selection = currentTool === 'select';
      canvas.defaultCursor = isSpacePressed ? 'grab' : 'default';
      canvas.hoverCursor = 'move';
    }
  }, [isPanning, currentTool, isSpacePressed]);

  const handleWheel = useCallback((e: fabric.TEvent<WheelEvent>) => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    const delta = e.e.deltaY;
    let currentZoom = canvas.getZoom();
    
    // Alt + scroll for zooming
    if (isAltPressed || e.e.ctrlKey) {
      e.e.preventDefault();
      e.e.stopPropagation();
      
      currentZoom *= 0.999 ** delta;
      if (currentZoom > 20) currentZoom = 20;
      if (currentZoom < 0.01) currentZoom = 0.01;
      
      const pointer = canvas.getPointer(e.e);
      canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), currentZoom);
      setZoom(currentZoom);
      return false;
    }
    
    return true;
  }, [isAltPressed]);

  // Utility functions
  const handleZoomIn = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const newZoom = Math.min(zoom * 1.1, 3);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const newZoom = Math.max(zoom * 0.9, 0.1);
    setZoom(newZoom);
    canvas.setZoom(newZoom);
    canvas.renderAll();
  }, [zoom]);

  const handleZoomReset = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    setZoom(1);
    canvas.setZoom(1);
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    canvas.renderAll();
  }, []);

  const handleUndo = useCallback(() => {
    if (!fabricCanvasRef.current || historyIndex <= 0) return;
    
    const canvas = fabricCanvasRef.current;
    const newIndex = historyIndex - 1;
    
    if (canvasHistory[newIndex]) {
      canvas.loadFromJSON(canvasHistory[newIndex], () => {
        canvas.renderAll();
      });
      setHistoryIndex(newIndex);
    }
  }, [canvasHistory, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!fabricCanvasRef.current || historyIndex >= canvasHistory.length - 1) return;
    
    const canvas = fabricCanvasRef.current;
    const newIndex = historyIndex + 1;
    
    if (canvasHistory[newIndex]) {
      canvas.loadFromJSON(canvasHistory[newIndex], () => {
        canvas.renderAll();
      });
      setHistoryIndex(newIndex);
    }
  }, [canvasHistory, historyIndex]);

  const handleExport = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
    
    const link = document.createElement('a');
    link.download = `${currentBoard?.title || 'whiteboard'}.png`;
    link.href = dataURL;
    link.click();
  }, [currentBoard?.title]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && fabricCanvasRef.current) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imgUrl = event.target?.result as string;
          fabric.FabricImage.fromURL(imgUrl, {
            crossOrigin: 'anonymous'
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
  }, []);
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: false, // Will be set in tool change effect
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

    // Load existing canvas content
    if (currentBoard?.content) {
      try {
        canvas.loadFromJSON(currentBoard.content, () => {
          canvas.renderAll();
          saveCanvasState(); // Save initial state
        });
      } catch (error) {
        console.warn('Failed to load canvas content:', error);
      }
    } else {
      // Save initial empty state
      saveCanvasState();
    }    // Initialize with default pen tool immediately
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.hoverCursor = 'crosshair';
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;

    // Mark canvas as initialized to trigger tool configuration
    setCanvasInitialized(true);

    return () => {
      canvas.dispose();
    };
  }, [currentBoard?.content, width, height, saveCanvasState, brushColor, brushSize]);

  // Update event handlers when dependencies change
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Event handlers
    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:up', handleMouseUp);
    canvas.on('mouse:wheel', handleWheel);

    return () => {
      canvas.off('path:created', handlePathCreated);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:wheel', handleWheel);
    };
  }, [
    handlePathCreated,
    handleObjectModified,
    handleSelectionCreated,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleWheel
  ]);  // Update canvas settings when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current || !canvasInitialized) return;

    const canvas = fabricCanvasRef.current;
    
    // Reset any active drawing state when changing tools
    setIsDrawing(false);
    setIsPanning(false);
    setLastPanPoint(null);
    
    // Disable all modes first
    canvas.isDrawingMode = false;
    canvas.selection = false;
    
    // Configure tool-specific settings
    switch (currentTool) {
      case 'pen':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        
        // Set brush type and properties
        switch (brushType) {
          case 'circle':
            canvas.freeDrawingBrush = new fabric.CircleBrush(canvas);
            break;
          case 'spray':
            canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
            break;
          default:
            canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        }
        
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
        break;

      case 'eraser': {
        // For eraser, use a white brush with destination-out composite operation
        canvas.isDrawingMode = true;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        
        // Create custom eraser brush
        const eraserBrush = new fabric.PencilBrush(canvas);
        eraserBrush.color = '#FFFFFF';
        eraserBrush.width = brushSize * 2;
        
        // Override the brush's _render method to use destination-out
        const originalRender = eraserBrush._render.bind(eraserBrush);
        eraserBrush._render = function() {
          if (canvas.contextTop) {
            canvas.contextTop.globalCompositeOperation = 'destination-out';
          }
          originalRender();
          if (canvas.contextTop) {
            canvas.contextTop.globalCompositeOperation = 'source-over';
          }
        };
        
        canvas.freeDrawingBrush = eraserBrush;
        break;
      }
        
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        break;
        
      default:
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'pointer';
    }
    
    canvas.renderAll();
  }, [currentTool, brushColor, brushSize, brushType, canvasInitialized]);

  // Socket event handlers
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    const handleCanvasAction = (action: any) => {
      if (!canvas) return;

      switch (action.type) {
        case 'add': {
          if (action.object) {
            try {
              fabric.util.enlivenObjects([action.object], {
                reviver: (object: fabric.FabricObject) => {
                  (object as FabricObjectWithId).id = action.objectId;
                  canvas.add(object);
                  canvas.renderAll();
                }
              } as any);
            } catch (error) {
              console.warn('Failed to add object:', error);
            }
          }
          break;
        }
        case 'update': {
          const existingObj = canvas.getObjects().find((obj: FabricObjectWithId) => obj.id === action.objectId);
          if (existingObj && action.object) {
            existingObj.set(action.object);
            canvas.renderAll();
          }
          break;
        }
        case 'delete': {
          const objToDelete = canvas.getObjects().find((obj: FabricObjectWithId) => obj.id === action.objectId);
          if (objToDelete) {
            canvas.remove(objToDelete);
            canvas.renderAll();
          }
          break;
        }
        case 'clear':
          canvas.clear();
          break;
        default:
          break;
      }
    };

    const handleDrawEnd = (data: any) => {
      if (data.object) {
        try {
          fabric.util.enlivenObjects([data.object], {
            reviver: (object: fabric.FabricObject) => {
              canvas.add(object);
              canvas.renderAll();
            }
          } as any);
        } catch (error) {
          console.warn('Failed to add draw object:', error);
        }
      }
    };

    socketService.on('canvas:action', handleCanvasAction);
    socketService.on('draw:end', handleDrawEnd);

    return () => {
      socketService.off('canvas:action', handleCanvasAction);
      socketService.off('draw:end', handleDrawEnd);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fabricCanvasRef.current) return;

      const canvas = fabricCanvasRef.current;

      // Prevent shortcuts when typing in text objects
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || 
          (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      // Handle space and alt keys for pan/zoom
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
        if (!isPanning) {
          canvas.defaultCursor = 'grab';
        }
      }
      if (e.altKey) {
        setIsAltPressed(true);
      }

      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace': {
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length > 0) {
            activeObjects.forEach((obj: FabricObjectWithId) => {
              if (obj.id && user) {
                emitCanvasAction({
                  type: 'delete',
                  objectId: obj.id,
                  boardId,
                  userId: user.id,
                  timestamp: new Date()
                });
              }
            });
            canvas.remove(...activeObjects);
            canvas.discardActiveObject();
            canvas.renderAll();
          }
          break;
        }
        case 'a': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const objects = canvas.getObjects();
            if (objects.length > 0) {
              const selection = new fabric.ActiveSelection(objects, { canvas });
              canvas.setActiveObject(selection);
              canvas.renderAll();
            }
          }
          break;
        }
        case 'escape': {
          canvas.discardActiveObject();
          canvas.renderAll();
          setShowColorPicker(false);
          break;
        }
        case 'p': {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setCurrentTool('pen');
          }
          break;
        }
        case 'v': {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setCurrentTool('select');
          }
          break;
        }
        case 'e': {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setCurrentTool('eraser');
          }
          break;
        }
        case 'z': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
          }
          break;
        }
        case 'y': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
        }
        case '=':
        case '+': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        }
        case '-': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        }
        case '0': {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomReset();
          }
          break;
        }
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        if (fabricCanvasRef.current && !isPanning) {
          fabricCanvasRef.current.defaultCursor = 'default';
        }
      }
      if (!e.altKey) {
        setIsAltPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [boardId, user, emitCanvasAction, handleUndo, handleRedo, handleZoomIn, handleZoomOut, handleZoomReset, isPanning]);

  // Tool functions
  const addShape = (shapeType: 'rectangle' | 'circle' | 'triangle') => {
    if (!fabricCanvasRef.current || !user) return;

    const canvas = fabricCanvasRef.current;
    let shape: fabric.FabricObject;

    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: brushColor,
          stroke: '#000',
          strokeWidth: 1,
          opacity
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: brushColor,
          stroke: '#000',
          strokeWidth: 1,
          opacity
        });
        break;
      case 'triangle':
        shape = new fabric.Triangle({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: brushColor,
          stroke: '#000',
          strokeWidth: 1,
          opacity
        });
        break;
      default:
        return;
    }

    (shape as FabricObjectWithId).id = Date.now().toString();
    canvas.add(shape);
    saveCanvasState();

    emitCanvasAction({
      type: 'add',
      objectId: (shape as FabricObjectWithId).id!,
      object: shape.toObject() as unknown as Record<string, unknown>,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  const addText = () => {
    if (!fabricCanvasRef.current || !user) return;

    const canvas = fabricCanvasRef.current;
    const text = new fabric.IText('Type here...', {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: brushColor,
      opacity
    });

    (text as FabricObjectWithId).id = Date.now().toString();
    canvas.add(text);
    saveCanvasState();

    emitCanvasAction({
      type: 'add',
      objectId: (text as FabricObjectWithId).id!,
      object: text.toObject() as unknown as Record<string, unknown>,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  const clearCanvas = () => {
    if (!fabricCanvasRef.current || !user) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();
    saveCanvasState();

    emitCanvasAction({
      type: 'clear',
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  const addLine = () => {
    if (!fabricCanvasRef.current || !user) return;

    const canvas = fabricCanvasRef.current;
    const line = new fabric.Line([50, 100, 200, 100], {
      stroke: brushColor,
      strokeWidth: brushSize,
      opacity
    });

    (line as FabricObjectWithId).id = Date.now().toString();
    canvas.add(line);
    saveCanvasState();

    emitCanvasAction({
      type: 'add',
      objectId: (line as FabricObjectWithId).id!,
      object: line.toObject() as unknown as Record<string, unknown>,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  const addArrow = () => {
    if (!fabricCanvasRef.current || !user) return;

    const canvas = fabricCanvasRef.current;
    
    // Create arrow using path
    const arrowPath = 'M 0 0 L 80 0 M 70 -5 L 80 0 L 70 5';
    const arrow = new fabric.Path(arrowPath, {
      left: 100,
      top: 100,
      stroke: brushColor,
      strokeWidth: brushSize,
      fill: '',
      opacity
    });

    (arrow as FabricObjectWithId).id = Date.now().toString();
    canvas.add(arrow);
    saveCanvasState();

    emitCanvasAction({
      type: 'add',
      objectId: (arrow as FabricObjectWithId).id!,
      object: arrow.toObject() as unknown as Record<string, unknown>,
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  const getCanvasClasses = () => {
    const classes = ['canvas-container'];
    if (isDrawing) classes.push('drawing');
    if (isPanning) classes.push('panning');
    if (isSpacePressed) classes.push('space-pressed');
    classes.push(`tool-${currentTool}`);
    return classes.join(' ');
  };

  return (
    <div className={getCanvasClasses()}>
      {/* Canvas */}
      <canvas ref={canvasRef} />
      
      {/* Enhanced Toolbar */}
      <div className="canvas-toolbar">
        {/* Drawing Tools */}
        <div className="tool-group">
          <button
            className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`}
            onClick={() => setCurrentTool('pen')}
            title="Pen Tool (P)"
          >
            <Pencil size={20} />
          </button>
          <button
            className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
            onClick={() => setCurrentTool('eraser')}
            title="Eraser Tool (E)"
          >
            <Eraser size={20} />
          </button>
          <button
            className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
            onClick={() => setCurrentTool('select')}
            title="Select Tool (V)"
          >
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
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      className={`color-preset ${brushColor === color ? 'active' : ''}`}
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
              onChange={(e) => setBrushType(e.target.value as 'pencil' | 'circle' | 'spray')}
              className="brush-type-select"
            >
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
            onClick={() => addShape('rectangle')} 
            className="tool-btn"
            title="Add Rectangle"
          >
            <Square size={20} />
          </button>
          <button 
            onClick={() => addShape('circle')} 
            className="tool-btn"
            title="Add Circle"
          >
            <Circle size={20} />
          </button>
          <button 
            onClick={() => addShape('triangle')} 
            className="tool-btn"
            title="Add Triangle"
          >
            <Triangle size={20} />
          </button>
          <button 
            onClick={addLine} 
            className="tool-btn"
            title="Add Line"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={addArrow} 
            className="tool-btn"
            title="Add Arrow"
          >
            <ArrowRight size={20} />
          </button>
          <button 
            onClick={addText} 
            className="tool-btn"
            title="Add Text"
          >
            <Type size={20} />
          </button>
        </div>
        
        {/* Action Tools */}
        <div className="tool-group">
          <button 
            onClick={handleUndo} 
            className="tool-btn"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={20} />
          </button>
          <button 
            onClick={handleRedo} 
            className="tool-btn"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={20} />
          </button>
          <button 
            onClick={clearCanvas} 
            className="tool-btn danger"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>
        
        {/* Zoom Controls */}
        <div className="tool-group">
          <button 
            onClick={handleZoomOut} 
            className="tool-btn"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={handleZoomIn} 
            className="tool-btn"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={handleZoomReset} 
            className="tool-btn"
            title="Reset Zoom"
          >
            <Home size={20} />
          </button>
        </div>
        
        {/* File Operations */}
        <div className="tool-group">
          <button 
            onClick={handleImport} 
            className="tool-btn"
            title="Import Image"
          >
            <Upload size={20} />
          </button>
          <button 
            onClick={handleExport} 
            className="tool-btn"
            title="Export as PNG"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
      
      {/* Pan and Zoom Instructions */}
      <div className="canvas-instructions">
        <div><kbd>Space</kbd> + drag to pan • <kbd>Alt</kbd> + scroll to zoom</div>
      </div>
    </div>
  );
};
