import React, { useCallback, useEffect, useRef, useState } from "react";
import Editor, { BrushData } from "./Editor";
import {
  Button,
  Content,
  ContextualHelp,
  Flex,
  Heading,
  Slider,
  Text,
  ToggleButton,
} from "@adobe/react-spectrum";
import { parseColor } from "@react-stately/color";
import { PenTool } from "@/utils/types";
import BrushIcon from "@spectrum-icons/workflow/Brush";
import EraserIcon from "@spectrum-icons/workflow/Erase";
import DeleteIcon from "@spectrum-icons/workflow/Delete";
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";
import { ColorWheel } from "@react-spectrum/color";
import {
  CanvasDataChangeHandler,
  CanvasDataChangeParams,
  CanvasEvents,
  CanvasStrokeEndHandler,
  CanvasStrokeEndParams,
} from "./event";
import { createImageFromPartOfCanvas } from "@/utils/image";
import { convertCartesianToScreen, getScreenPoint } from "@/utils/math";

export interface BrushCanvasProps {
  canvasWidth?: number;
  canvasHeight?: number;
  canvasLeftTopX?: number;
  canvasLeftTopY?: number;
  initData?: BrushData;
  setInitialBrushData: React.Dispatch<
    React.SetStateAction<
      | {
          canvasHeight: number;
          canvasWidth: number;
          canvasLeftTopX: number;
          canvasLeftTopY: number;
          data: BrushData;
        }
      | undefined
    >
  >;
  setBrushCanvasImageBlob: React.Dispatch<
    React.SetStateAction<Blob | undefined>
  >;
  style?: React.CSSProperties;
}

const BrushCanvas: React.FC<BrushCanvasProps> = props => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [dataCanvas, setDataCanvas] = useState<HTMLCanvasElement | null>(null);
  const [interactionCanvas, setInteractionCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [backgroundCanvas, setBackgroundCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [brushTool, setBrushTool] = useState<PenTool>(PenTool.PEN);
  const gotDataCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setDataCanvas(element);
  }, []);
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [canvasDataChangeListeners, setCanvasDataChangeListeners] = useState<
    CanvasDataChangeHandler[]
  >([]);
  const [strokeEndListeners, setStrokeEndListener] = useState<
    CanvasStrokeEndHandler[]
  >([]);
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set(),
  );

  const gotBackgroundCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setBackgroundCanvas(element);
  }, []);

  const gotInteractionCanvasRef = useCallback((element: HTMLCanvasElement) => {
    if (!element) {
      return;
    }
    element.style["touchAction"] = "none";
    setInteractionCanvas(element);
  }, []);

  const getImageBlob = useCallback(() => {
    if (!editor || !dataCanvas) {
      return;
    }
    const tempCanvas = document.createElement("canvas");
    const canvasInfo = editor.getCanvasInfo();
    const panZoom = editor.getPanZoom();
    const dpr = editor.getDpr();
    const originalElementWidth = editor.getWidth();
    const originalElementHeight = editor.getHeight();
    const widthExtensionRatio = dataCanvas.width / originalElementWidth;
    const heightExtensionRatio = dataCanvas.height / originalElementHeight;
    const convertedLeftTopScreenPoint = convertCartesianToScreen(
      dataCanvas,
      { x: canvasInfo.leftTopX, y: canvasInfo.leftTopY },
      dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLeftTopScreenPoint,
      panZoom,
    );
    const blob = createImageFromPartOfCanvas(
      dataCanvas,
      correctedLeftTopScreenPoint.x * widthExtensionRatio,
      correctedLeftTopScreenPoint.y * heightExtensionRatio,
      canvasInfo.width * panZoom.scale * widthExtensionRatio,
      canvasInfo.height * panZoom.scale * heightExtensionRatio,
    );
    props.setBrushCanvasImageBlob(blob);
    // tempCanvas.width = canvasInfo.width;
    // tempCanvas.height = canvasInfo.height;
    // const ctx = tempCanvas.getContext("2d");
    // if (!ctx) {
    //   return;
    // }
    // ctx.fillStyle = "#ffffff";
    // ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    // var img = new Image();

    // img.onload = function () {
    //   const width = img.width;
    //   const height = img.height;
    //   const ratio = width / height;
    //   const newWidth = tempCanvas.width;
    //   const newHeight = newWidth / ratio;
    //   ctx.drawImage(img, 0, 0, width, height, 0, 0, newWidth, newHeight);
    // };

    // img.src = URL.createObjectURL(blob);
    // document.body.appendChild(tempCanvas);
  }, [editor, props.setBrushCanvasImageBlob]);

  const addCanvasDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      setCanvasDataChangeListeners(prev => [...prev, listener]);
    },
    [],
  );

  const removeCanvasDataChangeListener = useCallback(
    (listener: CanvasDataChangeHandler) => {
      setCanvasDataChangeListeners(prev => prev.filter(l => l !== listener));
    },
    [],
  );

  const canvasDataChangeSetInitialDataListener = useCallback(
    (params: CanvasDataChangeParams) => {
      getImageBlob();
      props.setInitialBrushData({
        canvasHeight: params.canvasHeight,
        canvasWidth: params.canvasWidth,
        canvasLeftTopX: params.canvasLeftTopX,
        canvasLeftTopY: params.canvasLeftTopY,
        data: params.data,
      });
    },
    [props.setInitialBrushData, getImageBlob],
  );

  useEffect(() => {
    addCanvasDataChangeListener(canvasDataChangeSetInitialDataListener);
    return () => {
      removeCanvasDataChangeListener(canvasDataChangeSetInitialDataListener);
    };
  }, [
    addCanvasDataChangeListener,
    removeCanvasDataChangeListener,
    canvasDataChangeSetInitialDataListener,
  ]);

  const addStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      setStrokeEndListener(prev => [...prev, listener]);
    },
    [],
  );

  const removeStrokeEndListener = useCallback(
    (listener: CanvasStrokeEndHandler) => {
      setStrokeEndListener(prev => prev.filter(l => l !== listener));
    },
    [],
  );

  const strokeEndColorRecordListener = useCallback(
    (params: CanvasStrokeEndParams) => {
      setRecentlyUsedColors(prev => {
        const newSet = new Set(prev);
        newSet.add(params.brushColor);
        return newSet;
      });
    },
    [],
  );

  useEffect(() => {
    addStrokeEndListener(strokeEndColorRecordListener);
    return () => {
      removeStrokeEndListener(strokeEndColorRecordListener);
    };
  }, [
    addStrokeEndListener,
    removeStrokeEndListener,
    strokeEndColorRecordListener,
  ]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    canvasDataChangeListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.DATA_CHANGE, listener);
    });
    editor.emitCurrentDataChangeEvent();
    return () => {
      canvasDataChangeListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.DATA_CHANGE, listener);
      });
    };
  }, [canvasDataChangeListeners, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    strokeEndListeners.forEach(listener => {
      editor.addEventListener(CanvasEvents.STROKE_END, listener);
    });
    return () => {
      strokeEndListeners.forEach(listener => {
        editor?.removeEventListener(CanvasEvents.STROKE_END, listener);
      });
    };
  }, [strokeEndListeners, editor]);

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
    if (!dataCanvas || !backgroundCanvas || !interactionCanvas) {
      return;
    }

    const canvas = new Editor(
      dataCanvas,
      backgroundCanvas,
      interactionCanvas,
      350,
      350,
      props.canvasWidth,
      props.canvasHeight,
      props.canvasLeftTopX,
      props.canvasLeftTopY,
      props.initData,
    );
    setEditor(canvas);

    return () => {
      editor?.destroy();
    };
  }, [backgroundCanvas, dataCanvas, interactionCanvas]);

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
      if (tool === PenTool.ERASER) {
        changeStrokeWidth(strokeWidth * 2);
      } else {
        changeStrokeWidth(strokeWidth / 2);
      }
      setBrushTool(tool);
    },
    [editor, setBrushTool, changeStrokeWidth, strokeWidth],
  );

  const undo = useCallback(() => {
    editor?.undo();
  }, [editor]);

  const redo = useCallback(() => {
    editor?.redo();
  }, [editor]);

  useEffect(() => {
    changeBrushColor(finalSelectedColor.toString("hex"));
  }, [finalSelectedColor, changeBrushColor]);

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
            ref={gotDataCanvasRef}
            style={{
              position: "absolute",

              ...props.style,
            }}
          />
          <canvas
            ref={gotInteractionCanvasRef}
            style={{
              position: "absolute",
              touchAction: "none",
              ...props.style,
            }}
          />
        </div>
      </div>
      <div className="relative flex flex-col align-middle px-3 py-3 w-[210px] h-[350px]">
        <Flex
          justifyContent={"space-between"}
          alignItems={"center"}
          height={32}
        >
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
        <Slider
          labelPosition="side"
          label="brush size"
          showValueLabel={false}
          UNSAFE_className="mt-1"
          defaultValue={1}
          step={5}
          value={strokeWidth}
          onChange={value => {
            changeStrokeWidth(value);
          }}
          minValue={brushTool === PenTool.PEN ? 3 : 6}
          maxValue={brushTool === PenTool.PEN ? 23 : 46}
        />
        <ColorWheel
          size={130}
          UNSAFE_className="my-5 mx-auto"
          defaultValue="hsl(30, 100%, 50%)"
          value={changingColor}
          onChange={color => {
            setChangingColor(color);
            if (brushTool === PenTool.ERASER) {
              changeBrushTool(PenTool.PEN);
            }
          }}
          onChangeEnd={setFinalSelectedColor}
        />
        <Flex direction="column">
          <Text UNSAFE_className="text-xs mb-1">Recently Used Colors</Text>
          <Flex gap="size-100" wrap>
            {Array.from(recentlyUsedColors).map(color => (
              <div
                key={color}
                className={`w-6 h-6 rounded-full`}
                style={{
                  backgroundColor: color,
                }}
                onClick={() => {
                  const newColor = parseColor(color);
                  changeBrushTool(PenTool.PEN);
                  setFinalSelectedColor(newColor);
                }}
              />
            ))}
          </Flex>
        </Flex>
      </div>
    </Flex>
  );
};

export default BrushCanvas;
