import React, {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  useCallback,
} from "react";
import { fabric } from "fabric";

interface Props {
  shapeType: "rect" | "ellipse" | "triangle" | undefined;
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
  { shapeType, color },
  ref: ForwardedRef<ShapeEditorRef>,
) {
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const currentShape = React.useRef<{
    shape: fabric.Rect | fabric.Circle | fabric.Triangle;
    mouseDownOffset: { offsetX: number; offsetY: number };
  }>();

  const [undoHistory, setUndoHistory] = useState<string[]>([
    `{"version":"5.3.0","objects":[]}`,
  ]);
  const [redoHistory, setRedoHistory] = useState<string[]>([]);
  const undo = () => {
    const lastState = undoHistory[undoHistory.length - 1];
    if (!lastState) return;
    setUndoHistory(undoHistory.slice(0, undoHistory.length - 1));
    setRedoHistory([...redoHistory, lastState]);
    fabricRef.current?.loadFromJSON(lastState, function () {
      fabricRef.current?.renderAll();
    });
  };

  const redo = () => {
    const lastState = redoHistory[redoHistory.length - 1];
    if (!lastState) return;
    setRedoHistory(redoHistory.slice(0, redoHistory.length - 1));
    setUndoHistory([...undoHistory, lastState]);
    fabricRef.current?.loadFromJSON(lastState, function () {
      fabricRef.current?.renderAll();
    });
  };

  const getBase64Image = () => {
    const dataURL = fabricRef.current?.toDataURL({
      format: "png",
    });

    return dataURL;
  };

  const recordInHistory = () => {
    const state = JSON.stringify(fabricRef.current?.toJSON());
    setUndoHistory(prev => {
      return [...prev, state];
    });
    setRedoHistory([]);
  };

  const colorSelectedShape = (color: string) => {
    const activeObject = fabricRef.current?.getActiveObject();
    console.log(color, activeObject);
    if (activeObject) {
      activeObject.set("fill", color);
      fabricRef.current?.renderAll();
    }
  };
  useEffect(() => {
    const initFabric = () => {
      canvasRef.current?.setAttribute("width", "320");
      canvasRef.current?.setAttribute("height", "320");
      fabricRef.current = new fabric.Canvas(canvasRef.current);
      fabricRef.current.isDrawingMode = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Backspace" || event.key === "Delete") {
        const activeObject = fabricRef.current?.getActiveObject();
        if (activeObject) {
          fabricRef.current?.remove(activeObject);
        }
      }
    };

    // const addRectangle = () => {
    //   const rect = new fabric.Rect({
    //     top: 50,
    //     left: 50,
    //     width: 50,
    //     height: 50,
    //     fill: color,
    //   });

    //   fabricRef.current?.add(rect);
    // };

    const disposeFabric = () => {
      fabricRef.current?.dispose();
    };
    initFabric();
    document.addEventListener("keydown", onKeyDown);

    // addRectangle();

    return () => {
      disposeFabric();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!fabricRef.current) return;
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
      const allObjects = fabricRef.current!.getObjects();
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
        fabricRef.current!.add(rect);
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
        fabricRef.current!.add(ellipse);
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
        fabricRef.current!.add(triangle);
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

      fabricRef.current?.renderAll();
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
          fabricRef.current?.remove(currentShape.current.shape);
        }
      }

      const allObjects = fabricRef.current!.getObjects();
      allObjects.forEach(object => {
        object.selectable = true;
      });
      if (!event.target) {
        shouldRecordInHistory = false;
      }

      if (shouldRecordInHistory) {
        const state = JSON.stringify(fabricRef.current?.toJSON());
        console.log(undoHistory.length);

        setUndoHistory(prev => {
          return [...prev, state];
        });
        setRedoHistory([]);
      }

      currentShape.current = undefined;
    };

    fabricRef.current.on("mouse:down", onMouseDownHandler);
    fabricRef.current.on("mouse:move", onMouseMoveHandler);
    fabricRef.current.on("mouse:up", onMouseUpHandler);

    return () => {
      fabricRef.current?.off("mouse:down", onMouseDownHandler);
      fabricRef.current?.off("mouse:move", onMouseMoveHandler);
      fabricRef.current?.off("mouse:up", onMouseUpHandler);
    };
  }, [shapeType, fabricRef, color]);

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
    <canvas
      style={{
        border: "0.5px solid black",
      }}
      ref={canvasRef}
    />
  );
});

export default ShapeEditor;
