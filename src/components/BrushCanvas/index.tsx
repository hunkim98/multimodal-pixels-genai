import React, { useCallback, useEffect, useRef, useState } from "react";
import Canvas, { BrushData } from "./Canvas";
import {
  Button,
  Content,
  ContextualHelp,
  Flex,
  Heading,
  Text,
  ToggleButton,
} from "@adobe/react-spectrum";
import { PenTool } from "@/utils/types";
import BrushIcon from "@spectrum-icons/workflow/Brush";
import EraserIcon from "@spectrum-icons/workflow/Erase";
import DeleteIcon from "@spectrum-icons/workflow/Delete";
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";

export interface BrushCanvasProps {
  canvasWidth?: number;
  canvasHeight?: number;
  canvasLeftTopX?: number;
  canvasLeftTopY?: number;
  initData?: BrushData;
  style?: React.CSSProperties;
}

const BrushCanvas: React.FC<BrushCanvasProps> = props => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<Canvas | null>(null);
  const [interactionCanvas, setInteractionCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [backgroundCanvas, setBackgroundCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [brushTool, setBrushTool] = useState<PenTool>(PenTool.PEN);
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

  const changeBrushColor = useCallback(
    (color: string) => {
      if (!editor) {
        return;
      }
      editor?.changeBrushColor(color);
      setBrushColor(color);
    },
    [editor, setBrushColor],
  );

  const changeStrokeWidth = useCallback(
    (width: number) => {
      if (!editor) {
        return;
      }
      editor?.changeStrokeWidth(width);
      setStrokeWidth(width);
    },
    [editor, setStrokeWidth],
  );

  const changeBrushTool = useCallback(
    (tool: PenTool) => {
      if (!editor) {
        return;
      }
      editor?.changeBrushTool(tool);
      setBrushTool(tool);
    },
    [editor, setBrushTool],
  );

  const undo = useCallback(() => {
    editor?.undo();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.redo();
  }, [editor]);

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
          onKeyDown={e => {
            editor?.onKeyDown(e);
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
        <Flex justifyContent={"space-between"} UNSAFE_className="mt-1">
          <ToggleButton
            width={"size-600"}
            isSelected={brushTool === PenTool.PEN}
            onPress={() => {
              changeBrushTool(PenTool.PEN);
            }}
          >
            <BrushIcon />
          </ToggleButton>
          <ToggleButton
            isSelected={brushTool === PenTool.ERASER}
            width={"size-600"}
            onPress={() => {
              changeBrushTool(PenTool.ERASER);
            }}
          >
            <EraserIcon />
          </ToggleButton>
          <Button
            variant="secondary"
            onPress={() => {
              undo();
            }}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              redo();
            }}
          >
            <RedoIcon />
          </Button>
        </Flex>
      </div>
    </Flex>
  );
};

export default BrushCanvas;
