import React, { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";

export interface BrushCanvasProps {
  width: number | string;
  height: number | string;
  canvasWidth: number;
  canvasHeight: number;
  canvasLeftTopX?: number;
  canvasLeftTopY?: number;
  style?: React.CSSProperties;
  brushColor?: string;
}

const BrushCanvas: React.FC<BrushCanvasProps> = props => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<Canvas | null>(null);
  const [interactionCanvas, setInteractionCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [backgroundCanvas, setBackgroundCanvas] =
    useState<HTMLCanvasElement | null>(null);

  const gotInteractionCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setInteractionCanvas(element);
  }, []);

  const gotBackgroundCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setBackgroundCanvas(element);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (containerRef.current && editor) {
        const dpr = window.devicePixelRatio;
        const rect = containerRef.current.getBoundingClientRect();
        editor.setSize(rect.width, rect.height, dpr);
        editor.scale(dpr, dpr);
        editor.render();
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [editor, containerRef, props.height, props.width]);

  useEffect(() => {
    if (!interactionCanvas || !backgroundCanvas) {
      return;
    }

    const canvas = new Canvas(
      interactionCanvas,
      backgroundCanvas,
      props.canvasWidth,
      props.canvasHeight,
      props.canvasLeftTopX,
      props.canvasLeftTopY,
    );
    setEditor(canvas);

    return () => {
      editor?.destroy();
    };
  }, [backgroundCanvas, interactionCanvas]);

  return (
    <div
      style={{
        width: props.width,
        height: props.height,
        position: "relative",
        outline: "none",
      }}
      ref={containerRef}
      tabIndex={1}
      onMouseDown={() => {
        containerRef.current?.focus();
      }}
    >
      <canvas
        ref={gotBackgroundCanvasRef}
        style={{
          touchAction: "none",
          position: "absolute",

          ...props.style,
        }}
      />
      <canvas
        ref={gotInteractionCanvasRef}
        style={{
          position: "absolute",

          ...props.style,
        }}
      />
    </div>
  );
};

export default BrushCanvas;
