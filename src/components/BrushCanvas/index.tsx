import React, { useCallback, useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";
import {
  Content,
  ContextualHelp,
  Flex,
  Heading,
  Text,
} from "@adobe/react-spectrum";

export interface BrushCanvasProps {
  canvasWidth?: number;
  canvasHeight?: number;
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
  }, [editor, containerRef]);

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
    <Flex direction="row" gap="size-100">
      <div className="bg-white">
        <div
          style={{
            width: 350,
            height: 350,
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
      </div>
      <div className="relative flex flex-col align-middle px-3 py-3 w-[210px] h-[350px]">
        <Flex justifyContent={"space-between"} alignItems={"center"}>
          <ContextualHelp variant="info">
            <Heading>How to use?</Heading>
            <Content>
              <Text>
                The pixel canvas is a supplementary tool to help you give the
                model a rough image input to refer to when generating images.
                You are free to pan and zoom the canvas
              </Text>
            </Content>
          </ContextualHelp>
        </Flex>
      </div>
    </Flex>
  );
};

export default BrushCanvas;
