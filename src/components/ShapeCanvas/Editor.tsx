import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useCallback,
  useContext,
} from "react";
import { fabric } from "fabric";
import { ImageContext } from "../context/ImageContext";

interface Props {
  shapeType: "rect" | "ellipse" | "triangle" | undefined;
  setRecentlyUsedColors: React.Dispatch<React.SetStateAction<Set<string>>>;
  color: string;
}
export interface ShapeEditorRef {
  undo: () => void;
  redo: () => void;
  colorSelectedShape: (color: string) => void;
  recordInHistory: () => void;
  getBase64Image: () => string | undefined;
}

const ShapeEditor = forwardRef<ShapeEditorRef, Props>(function Editor(
  { shapeType, color, setRecentlyUsedColors },
  ref: ForwardedRef<ShapeEditorRef>,
) {
  const { imageUrlToEdit } = useContext(ImageContext);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const currentShape = React.useRef<{
    shape: fabric.Rect | fabric.Circle | fabric.Triangle;
    mouseDownOffset: { offsetX: number; offsetY: number };
  }>();

  const copiedElementRef = React.useRef<any>(null);
  const [undoHistory, setUndoHistory] = useState<string[]>([
    `{"version":"5.3.0","objects":[]}`,
  ]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const undo = () => {
    const lastState = undoHistory[undoHistory.length - 1];
    if (!lastState) {
      fabricCanvas?.clear();
      return;
    }
    setUndoHistory(undoHistory.slice(0, undoHistory.length - 1));
    setRedoHistory([...redoHistory, lastState]);
    fabricCanvas?.loadFromJSON(lastState, function () {
      fabricCanvas?.renderAll();
    });
  };

  const redo = () => {
    const lastState = redoHistory[redoHistory.length - 1];
    if (!lastState) return;
    setRedoHistory(redoHistory.slice(0, redoHistory.length - 1));
    setUndoHistory([...undoHistory, lastState]);
    fabricCanvas?.loadFromJSON(lastState, function () {
      fabricCanvas?.renderAll();
    });
  };

  const getBase64Image = () => {
    const dataURL = fabricCanvas?.toDataURL({
      format: "png",
    });

    return dataURL;
  };

  const recordInHistory = () => {
    const state = JSON.stringify(fabricCanvas?.toJSON());
    setUndoHistory(prev => {
      return [...prev, state];
    });
    setRedoHistory([]);
  };

  const colorSelectedShape = (color: string) => {
    const activeObject = fabricCanvas?.getActiveObject();
    if (activeObject) {
      activeObject.set("fill", color);
      fabricCanvas?.renderAll();
      setRecentlyUsedColors(prev => {
        const newSet = new Set(prev);
        newSet.add(color);
        return newSet;
      });
    }
  };
  useEffect(() => {
    const initFabric = () => {
      canvasRef.current?.setAttribute("width", "320");
      canvasRef.current?.setAttribute("height", "320");
      const canvas = new fabric.Canvas(canvasRef.current);
      setFabricCanvas(canvas);
      canvas.isDrawingMode = false;
    };

    // const addRectangle = () => {
    //   const rect = new fabric.Rect({
    //     top: 50,
    //     left: 50,
    //     width: 50,
    //     height: 50,
    //     fill: color,
    //   });

    //   fabricCanvas?.add(rect);
    // };

    const disposeFabric = () => {
      fabricCanvas?.dispose();
    };
    initFabric();

    // addRectangle();

    return () => {
      disposeFabric();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        const activeObject = fabricCanvas?.getActiveObject();
        if (activeObject) {
          fabricCanvas?.remove(activeObject);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "c") {
        const activeObject = fabricCanvas?.getActiveObject();
        if (activeObject) {
          activeObject.clone((cloned: any) => {
            // setCopiedElement(cloned);
            copiedElementRef.current = cloned;
          });
        }
        // canvas?.cloneSelectedElements(5, 5);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        // canvas?.cloneSelectedElements(5, 5);
        if (copiedElementRef.current) {
          copiedElementRef.current.clone(function (clonedObj: any) {
            fabricCanvas?.discardActiveObject();
            clonedObj.set({
              left: clonedObj.left + 10,
              top: clonedObj.top + 10,
              evented: true,
            });
            if (clonedObj.type === "activeSelection") {
              // active selection needs a reference to the canvas.
              clonedObj.canvas = fabricCanvas;
              clonedObj.forEachObject(function (obj: any) {
                fabricCanvas?.add(obj);
              });
              // this should solve the unselectability
              clonedObj.setCoords();
            } else {
              fabricCanvas?.add(clonedObj);
            }
            copiedElementRef.current.top += 10;
            copiedElementRef.current.left += 10;
            fabricCanvas?.setActiveObject(clonedObj);
            fabricCanvas?.requestRenderAll();
          });
          recordInHistory();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // addRectangle();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fabricCanvas, recordInHistory]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const onMouseDownHandler = (event: fabric.IEvent) => {
      if (!shapeType) return;
      if (event.target) {
        return; // if we have clicked on an existing shape, don't create a new one
      }
      const { offsetX, offsetY } = event.e as MouseEvent;
      const { top, left } = currentShape.current?.shape.getBoundingRect() || {
        top: 0,
        left: 0,
      };
      const allObjects = fabricCanvas!.getObjects();
      allObjects.forEach(object => {
        object.selectable = false;
      });

      if (shapeType === "rect") {
        const rect = new fabric.Rect({
          top: offsetY - top,
          left: offsetX - left,
          width: 0,
          height: 0,
          fill: color,
        });
        currentShape.current = {
          shape: rect,
          mouseDownOffset: { offsetX, offsetY },
        };
        fabricCanvas!.add(rect);
      } else if (shapeType === "ellipse") {
        const ellipse = new fabric.Ellipse({
          top: offsetY - top,
          left: offsetX - left,
          fill: color,
        });
        currentShape.current = {
          shape: ellipse,
          mouseDownOffset: { offsetX, offsetY },
        };
        fabricCanvas!.add(ellipse);
      } else if (shapeType === "triangle") {
        const triangle = new fabric.Triangle({
          top: offsetY - top,
          left: offsetX - left,
          width: 0,
          height: 0,
          fill: color,
        });
        currentShape.current = {
          shape: triangle,
          mouseDownOffset: { offsetX, offsetY },
        };
        fabricCanvas!.add(triangle);
      }
    };

    const onMouseMoveHandler = (event: fabric.IEvent) => {
      if (!shapeType) return;
      // we could already be clicking a shape
      const { offsetX, offsetY } = event.e as MouseEvent;
      const mouseDown = currentShape.current?.mouseDownOffset;
      if (!mouseDown) return;

      const xDistance = offsetX - mouseDown.offsetX;
      const yDistance = offsetY - mouseDown.offsetY;
      if (!currentShape.current) return;

      const shouldFlipX = xDistance > 0;
      const shouldFlipY = yDistance > 0;
      if (shapeType === "rect") {
        (currentShape.current.shape as fabric.Rect).set({
          width: Math.abs(xDistance),
          height: Math.abs(yDistance),
          // scaleX: offsetX - mouseDown.offsetX > 0 ? -1 : 1,
          // scaleY: offsetY - mouseDown.offsetY > 0 ? -1 : 1,
          // flipX: offsetX < left,
          // flipY: offsetY < top,
          // flipX: shouldFlipX,
          // flipY: shouldFlipY,
          originX: shouldFlipX ? "left" : "right",
          originY: shouldFlipY ? "top" : "bottom",
        });
        currentShape.current.shape.setCoords();
      } else if (shapeType === "ellipse") {
        (currentShape.current.shape as fabric.Ellipse).set({
          rx: Math.abs(xDistance / 2),
          ry: Math.abs(yDistance / 2),
          originX: shouldFlipX ? "left" : "right",
          originY: shouldFlipY ? "top" : "bottom",
        });
        currentShape.current.shape.setCoords();
      } else if (shapeType === "triangle") {
        (currentShape.current.shape as fabric.Triangle).set({
          // width: offsetX - left,
          // height: offsetY - top,
          width: Math.abs(xDistance),
          height: Math.abs(yDistance),
          originX: shouldFlipX ? "left" : "right",
          originY: shouldFlipY ? "top" : "bottom",
          flipX: shouldFlipX,
          flipY: shouldFlipY,
        });
        currentShape.current.shape.setCoords();
      }

      fabricCanvas?.renderAll();
    };

    const onMouseUpHandler = (event: fabric.IEvent) => {
      let shouldRecordInHistory = true;
      if (currentShape.current) {
        if (
          (currentShape.current &&
            currentShape.current.shape.width !== undefined &&
            Math.abs(currentShape.current.shape.width) <= 3) ||
          (currentShape.current.shape.height !== undefined &&
            Math.abs(currentShape.current.shape.height) <= 3)
        ) {
          shouldRecordInHistory = false;
          fabricCanvas?.remove(currentShape.current.shape);
        }
      }

      const allObjects = fabricCanvas!.getObjects();
      allObjects.forEach(object => {
        object.selectable = true;
      });
      if (!event.target) {
        shouldRecordInHistory = false;
      }

      if (shouldRecordInHistory) {
        const state = JSON.stringify(fabricCanvas?.toJSON());

        setRecentlyUsedColors(prev => {
          const newSet = new Set(prev);
          newSet.add(color);
          return newSet;
        });

        setUndoHistory(prev => {
          return [...prev, state];
        });
        setRedoHistory([]);
      }

      currentShape.current = undefined;
    };

    fabricCanvas.on("mouse:down", onMouseDownHandler);
    fabricCanvas.on("mouse:move", onMouseMoveHandler);
    fabricCanvas.on("mouse:up", onMouseUpHandler);

    return () => {
      fabricCanvas?.off("mouse:down", onMouseDownHandler);
      fabricCanvas?.off("mouse:move", onMouseMoveHandler);
      fabricCanvas?.off("mouse:up", onMouseUpHandler);
    };
  }, [shapeType, fabricCanvas, color]);

  useImperativeHandle(
    ref,
    () => ({
      undo,
      redo,
      colorSelectedShape,
      recordInHistory,
      getBase64Image,
    }),
    [undo, redo, colorSelectedShape, recordInHistory, getBase64Image],
  );

  return (
    <div className="relative">
      <canvas
        style={{
          border: "0.5px solid black",
        }}
        ref={canvasRef}
      />
    </div>
  );
});

export default ShapeEditor;
