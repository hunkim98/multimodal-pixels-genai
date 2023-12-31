import React, {
  ForwardedRef,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import { SketchTool } from "@/utils/types";
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
import { blobToBase64, createImageFromPartOfCanvas } from "@/utils/image";
import { convertCartesianToScreen, getScreenPoint } from "@/utils/math";
import { ImageExportRef } from "@/types/imageExportRef";
import { Forward } from "@spectrum-icons/workflow/index";
import { ImageContext } from "../context/ImageContext";

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

const BrushCanvas = forwardRef<ImageExportRef, BrushCanvasProps>(
  function Canvas(props, ref: ForwardedRef<ImageExportRef>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { imageUrlToEdit, setImageUrlToEdit } = useContext(ImageContext);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [dataCanvas, setDataCanvas] = useState<HTMLCanvasElement | null>(
      null,
    );
    const [interactionCanvas, setInteractionCanvas] =
      useState<HTMLCanvasElement | null>(null);
    const [backgroundCanvas, setBackgroundCanvas] =
      useState<HTMLCanvasElement | null>(null);
    const [brushColor, setBrushColor] = useState<string>("#ff0000");
    const [strokeWidth, setStrokeWidth] = useState<number>(3);
    const [brushTool, setBrushTool] = useState<SketchTool>(SketchTool.PEN);
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
    const [recentlyUsedColors, setRecentlyUsedColors] = useState<Array<string>>(
      [],
    );

    useEffect(() => {
      if (!editor) {
        return;
      }
      if (imageUrlToEdit) {
        editor.reset();
        editor.changeBrushColor("#DDDDDD");
        setRecentlyUsedColors([]);
      } else {
        editor.reset();
        editor.changeBrushColor(finalSelectedColor.toString("hex"));
        setRecentlyUsedColors([]);
      }
    }, [imageUrlToEdit, editor, setRecentlyUsedColors]);

    const gotBackgroundCanvasRef = useCallback((element: HTMLCanvasElement) => {
      if (!element) {
        return;
      }
      element.style["touchAction"] = "none";
      setBackgroundCanvas(element);
    }, []);

    const gotInteractionCanvasRef = useCallback(
      (element: HTMLCanvasElement) => {
        if (!element) {
          return;
        }
        element.style["touchAction"] = "none";
        setInteractionCanvas(element);
      },
      [],
    );

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
        dataCanvas.width,
        dataCanvas.height,
        512,
        512,
        dpr,
      );
      props.setBrushCanvasImageBlob(blob);
      return blob;
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
          const newArray = Array.from(newSet);
          if (!newSet.has(params.brushColor)) {
            if (newSet.size >= 6) {
              newArray.pop();
            }
            newArray.unshift(params.brushColor);
          }
          return newArray;
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
        320,
        320,
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
      (tool: SketchTool) => {
        if (!editor) {
          return;
        }
        editor?.changeBrushTool(tool);
        if (tool === SketchTool.ERASER) {
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

    useImperativeHandle(
      ref,
      () => ({
        getBase64Image: async () => {
          return (await blobToBase64(getImageBlob() as Blob)) as string;
        },
      }),
      [editor],
    );

    return (
      <Flex direction="row" gap="size-100">
        <div className="bg-white border-[0.5px] border-black">
          <div
            style={{
              width: 320,
              height: 320,
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
            {imageUrlToEdit && (
              <img
                src={imageUrlToEdit}
                style={{
                  touchAction: "none",
                  pointerEvents: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 320,
                  height: 320,
                  // opacity: 0.8,
                }}
              />
            )}
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
        <div className="relative flex flex-col align-middle px-3 py-3 w-[250px] h-[320px]">
          {/* <Flex
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
        </Flex> */}
          <Flex justifyContent={"space-between"} UNSAFE_className="mt-1">
            <ToggleButton
              width={"size-600"}
              isSelected={brushTool === SketchTool.PEN}
              onPress={() => {
                changeBrushTool(SketchTool.PEN);
              }}
            >
              <BrushIcon />
            </ToggleButton>
            <ToggleButton
              isSelected={brushTool === SketchTool.ERASER}
              width={"size-600"}
              onPress={() => {
                changeBrushTool(SketchTool.ERASER);
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
            minValue={brushTool === SketchTool.PEN ? 3 : 6}
            maxValue={brushTool === SketchTool.PEN ? 23 : 46}
          />
          <div className="flex gap-1 mb-[-10px]">
            <div
              className="bg-black border border-black w-[18px] h-[18px]"
              onClick={() => {
                // change to black
                setFinalSelectedColor(parseColor("hsl(0, 0%, 0%)"));
              }}
            ></div>
            <div
              className="bg-white border border-black w-[18px] h-[18px]"
              onClick={() => {
                //change to white
                setFinalSelectedColor(parseColor("hsl(0, 0%, 100%)"));
              }}
            ></div>
          </div>
          <ColorWheel
            size={130}
            isDisabled={imageUrlToEdit ? true : false}
            UNSAFE_className="my-5 mx-auto"
            defaultValue="hsl(30, 100%, 50%)"
            value={changingColor}
            onChange={color => {
              setChangingColor(color);
              if (brushTool === SketchTool.ERASER) {
                changeBrushTool(SketchTool.PEN);
              }
            }}
            onChangeEnd={setFinalSelectedColor}
          />
          {!imageUrlToEdit ? (
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
                      changeBrushTool(SketchTool.PEN);
                      setFinalSelectedColor(newColor);
                    }}
                  />
                ))}
              </Flex>
            </Flex>
          ) : (
            <Button
              variant="primary"
              onPress={() => {
                setImageUrlToEdit(undefined);
              }}
            >
              Cancel Editing
            </Button>
          )}
        </div>
      </Flex>
    );
  },
);

export default BrushCanvas;
