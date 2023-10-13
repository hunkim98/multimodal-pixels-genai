import React, { useEffect, useState } from "react";
import { fabric } from "fabric";

interface Props {
  shapeType: "rect" | "ellipse" | "triangle" | undefined;
}

function Editor({ shapeType }: Props) {
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const currentShape = React.useRef<
    fabric.Rect | fabric.Circle | fabric.Triangle
  >();

  useEffect(() => {
    const initFabric = () => {
      canvasRef.current?.setAttribute("width", "320");
      canvasRef.current?.setAttribute("height", "320");
      fabricRef.current = new fabric.Canvas(canvasRef.current);
      fabricRef.current.isDrawingMode = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      console.log("hey!");
      if (event.key === "Backspace" || event.key === "Delete") {
        const activeObject = fabricRef.current?.getActiveObject();
        console.log(activeObject);
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
    //     fill: "red",
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
      const { top, left } = currentShape.current?.getBoundingRect() || {
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
          fill: "red",
        });
        currentShape.current = rect;
        fabricRef.current!.add(rect);
      } else if (shapeType === "ellipse") {
        const ellipse = new fabric.Ellipse({
          top: offsetY - top,
          left: offsetX - left,
          fill: "red",
        });
        currentShape.current = ellipse;
        fabricRef.current!.add(ellipse);
      } else if (shapeType === "triangle") {
        const triangle = new fabric.Triangle({
          top: offsetY - top,
          left: offsetX - left,
          width: 0,
          height: 0,
          fill: "red",
        });
        currentShape.current = triangle;
        fabricRef.current!.add(triangle);
      }
    };

    const onMouseMoveHandler = (event: fabric.IEvent) => {
      if (!shapeType) return;
      // we could already be clicking a shape
      const { offsetX, offsetY } = event.e as MouseEvent;
      const { top, left } = currentShape.current?.getBoundingRect() || {
        top: 0,
        left: 0,
      };
      if (!currentShape.current) return;
      if (shapeType === "rect") {
        (currentShape.current as fabric.Rect).set({
          width: offsetX - left,
          height: offsetY - top,
        });
        currentShape.current.setCoords();
      } else if (shapeType === "ellipse") {
        const xDistance = offsetX - left;
        const yDistance = offsetY - top;

        const shouldFlipX = xDistance < 0;
        const shouldFlipY = yDistance < 0;

        (currentShape.current as fabric.Ellipse).set({
          rx: Math.abs(xDistance / 2),
          ry: Math.abs(yDistance / 2),
          originX: shouldFlipX ? "right" : "left",
          originY: shouldFlipY ? "bottom" : "top",
        });
        currentShape.current.setCoords();
      } else if (shapeType === "triangle") {
        (currentShape.current as fabric.Triangle).set({
          width: offsetX - left,
          height: offsetY - top,
        });
        currentShape.current.setCoords();
      }

      fabricRef.current?.renderAll();
    };

    const onMouseUpHandler = (event: fabric.IEvent) => {
      if (!currentShape.current) return;
      if (
        (currentShape.current.width !== undefined &&
          Math.abs(currentShape.current.width) <= 3) ||
        (currentShape.current.height !== undefined &&
          Math.abs(currentShape.current.height) <= 3)
      ) {
        console.log("removing object!", currentShape.current);
        fabricRef.current?.remove(currentShape.current);
      }

      const allObjects = fabricRef.current!.getObjects();
      allObjects.forEach(object => {
        object.selectable = true;
      });

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
  }, [shapeType, fabricRef]);

  return (
    <canvas
      style={{
        border: "0.5px solid black",
      }}
      ref={canvasRef}
    />
  );
}

export default Editor;
