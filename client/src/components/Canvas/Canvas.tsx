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
  Home
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
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser' | 'select'>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const { currentBoard, emitCanvasAction } = useBoardStore();
  const { user } = useAuthStore();

  // Predefined colors
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

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
    // TODO: Implement undo functionality with state management
    console.log('Undo functionality to be implemented');
  }, []);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo functionality with state management
    console.log('Redo functionality to be implemented');
  }, []);

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
      selection: currentTool === 'select',
      preserveObjectStacking: true
    });

    fabricCanvasRef.current = canvas;

    // Load existing canvas content
    if (currentBoard?.content) {
      try {
        canvas.loadFromJSON(currentBoard.content, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.warn('Failed to load canvas content:', error);
      }
    }

    // Setup drawing mode
    canvas.isDrawingMode = currentTool === 'pen';
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }    // Event handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePathCreated = (e: any) => {
      if (!e.path || !user) return;

      const pathData = e.path.toObject() as unknown as Record<string, unknown>;
      const pathObject = e.path as FabricObjectWithId;
      pathObject.id = pathObject.id || Date.now().toString();
      
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
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleObjectModified = (e: any) => {
      if (!e.target || !user) return;

      const objectData = e.target.toObject() as unknown as Record<string, unknown>;
      const targetObject = e.target as FabricObjectWithId;
      
      emitCanvasAction({
        type: 'update',
        objectId: targetObject.id || Date.now().toString(),
        object: objectData,
        boardId,
        userId: user.id,
        timestamp: new Date()
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectionCreated = (e: any) => {
      if (!e.selected || !user) return;

      const selectedIds = e.selected.map((obj: FabricObjectWithId) => obj.id || '').filter(Boolean);
      socketService.emitSelectionChange({
        objects: selectedIds,
        boardId
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
      if (!user) return;

      const pointer = canvas.getPointer(e.e);
      socketService.emitCursorMove({
        x: pointer.x,
        y: pointer.y,
        boardId
      });
    };

    canvas.on('path:created', handlePathCreated);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('mouse:move', handleMouseMove);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [currentBoard?.content, width, height, brushColor, brushSize, currentTool, boardId, user, emitCanvasAction]);

  // Update canvas settings when tool changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    canvas.isDrawingMode = currentTool === 'pen';
    canvas.selection = currentTool === 'select';
    
    if (currentTool === 'pen' && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  }, [currentTool, brushColor, brushSize]);

  // Socket event handlers
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    };    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDrawEnd = (data: any) => {
      if (data.object) {
        try {
          fabric.util.enlivenObjects([data.object], {
            reviver: (object: fabric.FabricObject) => {
              canvas.add(object);
              canvas.renderAll();
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [boardId, user, emitCanvasAction, handleUndo, handleRedo, handleZoomIn, handleZoomOut, handleZoomReset]);

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
          strokeWidth: 1
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: brushColor,
          stroke: '#000',
          strokeWidth: 1
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
          strokeWidth: 1
        });
        break;
      default:
        return;
    }

    (shape as FabricObjectWithId).id = Date.now().toString();
    canvas.add(shape);

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
      fill: brushColor
    });

    (text as FabricObjectWithId).id = Date.now().toString();
    canvas.add(text);

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

    emitCanvasAction({
      type: 'clear',
      boardId,
      userId: user.id,
      timestamp: new Date()
    });
  };

  return (
    <div className="canvas-container">
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
    </div>
  );
};
