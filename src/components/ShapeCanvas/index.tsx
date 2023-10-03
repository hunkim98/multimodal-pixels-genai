import React from "react";
import { fabric } from "fabric";
import { Flex } from "@adobe/react-spectrum";

const ShapeCanvas = () => {
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const initFabric = () => {
      fabricRef.current = new fabric.Canvas(canvasRef.current);
    };

    const addRectangle = () => {
      const rect = new fabric.Rect({
        top: 50,
        left: 50,
        width: 50,
        height: 50,
        fill: "red",
      });

      fabricRef.current?.add(rect);
    };

    const disposeFabric = () => {
      fabricRef.current?.dispose();
    };

    initFabric();
    addRectangle();

    return () => {
      disposeFabric();
    };
  }, []);

  return (
    <Flex direction="row" gap="size-100">
      <canvas ref={canvasRef} />
    </Flex>
  );
};

export default ShapeCanvas;
