import { Inter } from "next/font/google";
import {
  Button,
  Flex,
  TextField,
  Text,
  Image,
  Heading,
  Slider,
  Switch,
  ToggleButton,
  Content,
  ContextualHelp,
  ProgressCircle,
} from "@adobe/react-spectrum";
import ChveronRightMedium from "@spectrum-icons/ui/ChevronRightMedium";
import BrushIcon from "@spectrum-icons/workflow/Brush";
import EraserIcon from "@spectrum-icons/workflow/Erase";
import DeleteIcon from "@spectrum-icons/workflow/Delete";
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";
import {
  BrushTool,
  CanvasBrushChangeHandler,
  CanvasDataChangeHandler,
  CanvasDataChangeParams,
  CanvasStrokeEndHandler,
  Dotting,
  DottingData,
  DottingRef,
  PixelModifyItem,
  useBrush,
  useData,
  useDotting,
  useHandlers,
} from "dotting";
import { parseColor } from "@react-stately/color";

import { useCallback, useEffect, useRef, useState } from "react";
import { ColorWheel } from "@react-spectrum/color";
import { ModelInputs } from "@/types/replicate";
import axios from "axios";
import { imageFileUpload } from "@/utils/upload";
import { blobToBase64, createImageOutOfNestedColorArray } from "@/utils/image";
import {
  brushSizeFive,
  brushSizeFour,
  brushSizeOne,
  brushSizeThree,
  brushSizeTwo,
} from "@/utils/brush";
import { blob } from "stream/consumers";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [isPixelCanvasOpen, setIsPixelCanvasOpen] = useState(false);
  const dottingRef = useRef<DottingRef>(null);
  const [brushTool, setBrushTool] = useState(BrushTool.DOT);
  let [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)")
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set()
  );
  const [userDataArray, setUserDataArray] =
    useState<Array<Array<PixelModifyItem>>>();
  let [finalValue, setFinalValue] = useState(parseColor("hsl(50, 100%, 50%)"));
  const [isGridVisible, setIsGridVisible] = useState(true);
  const { clear, undo, redo } = useDotting(dottingRef);
  const [isModelActive, setIsModelActive] = useState(false);
  const {
    addDataChangeListener,
    addStrokeEndListener,
    addBrushChangeListener,
  } = useHandlers(dottingRef);
  const [brushSize, setBrushSize] = useState(1);
  const { changeBrushColor, changeBrushTool, changeBrushPattern } =
    useBrush(dottingRef);
  const [galleryImage, setGalleryImages] = useState<Array<string>>([
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/824587c6-c0b1-4b5c-9eb3-f6e92715f38a-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/2b14af4a-1cf9-4738-870d-610c93961def-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/07cfe359-de1a-479c-829b-2d2ec8a2d6c5-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/96f0f0b5-df1b-4dd8-9afc-9f4aa19a40b4-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/9ee9d9df-c2ec-49e4-aaff-19d4c2328bdc-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/756e4d6c-349c-4dbc-9de8-48d44498298d-image.png",
  ]);
  const [modelInputs, setModelInputs] = useState<ModelInputs>({
    prompt: "A robot sitting on the ground",
    image: undefined,
  });
  const generateImages = useCallback(
    (imageUrl?: string) => {
      axios
        .post("/api/replicate", { ...modelInputs, image: imageUrl })
        .then((res) => {
          const images = res.data as Array<string>;
          setGalleryImages((prev) => [...prev, ...images]);
          setIsModelActive(false);
        })
        .catch((err) => {
          setIsModelActive(false);
        });
    },
    [modelInputs]
  );
  useEffect(() => {
    switch (brushSize) {
      case 1:
        changeBrushPattern(brushSizeOne);
        break;
      case 2:
        changeBrushPattern(brushSizeTwo);
        break;
      case 3:
        changeBrushPattern(brushSizeThree);
        break;
      case 4:
        changeBrushPattern(brushSizeFour);
        break;
      case 5:
        changeBrushPattern(brushSizeFive);
        break;
      default:
        changeBrushPattern(brushSizeOne);
        break;
    }
  }, [brushSize, changeBrushPattern]);

  useEffect(() => {
    const dataChangeListener: CanvasDataChangeHandler = ({ data }) => {
      if (data.size === 0) {
        return;
      }
      const allRowKeys = Array.from(data.keys());
      const allColumnKeys = Array.from(data.get(allRowKeys[0])!.keys());
      const currentTopIndex = Math.min(...allRowKeys);
      const currentLeftIndex = Math.min(...allColumnKeys);
      const currentBottomIndex = Math.max(...allRowKeys);
      const currentRightIndex = Math.max(...allColumnKeys);
      const tempArray = [];
      for (let i = currentTopIndex; i <= currentBottomIndex; i++) {
        const row = [];
        for (let j = currentLeftIndex; j <= currentRightIndex; j++) {
          const pixel = data.get(i)?.get(j);
          if (pixel) {
            row.push({
              rowIndex: i,
              columnIndex: j,
              color: pixel.color,
            });
          }
        }
        tempArray.push(row);
      }
      setUserDataArray(tempArray);
    };
    addDataChangeListener(dataChangeListener);
  }, [isPixelCanvasOpen, addDataChangeListener]);

  useEffect(() => {
    const strokeEndListener: CanvasStrokeEndHandler = ({
      strokedPixels,
      strokeTool,
    }) => {
      if (strokeTool === BrushTool.DOT) {
        const color = strokedPixels[strokedPixels.length - 1].color;
        setRecentlyUsedColors((prev) => {
          const newSet = new Set(prev);
          newSet.add(color);
          return newSet;
        });
      }
    };
    addStrokeEndListener(strokeEndListener);
  }, [isPixelCanvasOpen, addStrokeEndListener]);

  useEffect(() => {
    if (recentlyUsedColors.size > 6) {
      const newSet = new Set(recentlyUsedColors);
      newSet.delete(Array.from(recentlyUsedColors)[0]);
      setRecentlyUsedColors(newSet);
    }
  }, [recentlyUsedColors]);

  useEffect(() => {
    const brushToolListener: CanvasBrushChangeHandler = ({ brushTool }) => {
      setBrushTool(brushTool);
    };
    addBrushChangeListener(brushToolListener);
  }, [isPixelCanvasOpen, addBrushChangeListener, setBrushTool]);

  useEffect(() => {
    if (!isPixelCanvasOpen) {
      setBrushTool((prev) => {
        if (prev !== BrushTool.DOT) {
          return BrushTool.DOT;
        }
        return prev;
      });
    }
  }, [isPixelCanvasOpen, setBrushTool]);

  useEffect(() => {
    changeBrushColor(finalValue.toString("hex"));
  }, [finalValue, changeBrushColor]);

  return (
    <main className={`flex min-h-screen flex-col p-24 ${inter.className}`}>
      <div className="flex flex-row justify-center align-middle">
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100">
            <TextField
              label="Start with a detailed description"
              width={"size-6000"}
              value={modelInputs.prompt}
              onChange={(value) => {
                setModelInputs({ ...modelInputs, prompt: value });
              }}
            />
            <Button
              variant={"accent"}
              UNSAFE_style={{
                // backgroundColor: "#000000",
                cursor: "pointer",
              }}
              isDisabled={isModelActive}
              alignSelf={"end"}
              onPress={() => {
                setIsModelActive(true);
                if (!isPixelCanvasOpen) {
                  generateImages();
                } else {
                  if (userDataArray) {
                    blobToBase64(
                      createImageOutOfNestedColorArray(userDataArray)
                    )
                      .then((base64String) => {
                        generateImages(base64String as string);
                      })
                      .catch((err) => {
                        setIsModelActive(false);
                      });
                    // imageFileUpload(
                    //   createImageOutOfNestedColorArray(userDataArray)
                    // ).then((url) => {
                    //   generateImages(url);
                    // });
                  } else {
                    generateImages();
                  }
                }
                setIsPixelCanvasOpen(false);
              }}
            >
              {isModelActive ? (
                <ProgressCircle
                  size="S"
                  aria-label="Loading…"
                  isIndeterminate
                />
              ) : (
                <>Generate</>
              )}
            </Button>
          </Flex>
          <div
            className="z-50"
            onClick={() => setIsPixelCanvasOpen(!isPixelCanvasOpen)}
          >
            <Flex
              alignItems={"center"}
              gap={"size-100"}
              UNSAFE_style={{
                cursor: "pointer",
              }}
            >
              <div
                className={`${
                  isPixelCanvasOpen ? "rotate-90" : "rotate-0"
                } transition-all`}
              >
                <ChveronRightMedium />
              </div>
              <Text
                UNSAFE_style={{
                  fontWeight: "bold",
                }}
              >
                {isPixelCanvasOpen
                  ? "Close supplementary pixel canvas"
                  : "Generate Images with supplementary pixel image"}
              </Text>
            </Flex>
            {isPixelCanvasOpen && (
              <div
                className={`flex bg-white rounded-md overflow-hidden absolute shadow-md mt-2`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white">
                  <Dotting
                    ref={dottingRef}
                    width={350}
                    height={350}
                    isGridVisible={isGridVisible}
                    initData={userDataArray}
                    style={{
                      border: "none",
                    }}
                  />
                </div>
                <div className="relative flex flex-col align-middle px-3 py-3 w-[210px] h-[350px]">
                  <Flex justifyContent={"space-between"} alignItems={"center"}>
                    <Flex alignItems={"center"}>
                      <Switch
                        isSelected={isGridVisible}
                        onChange={setIsGridVisible}
                      />
                      <Text
                        UNSAFE_className="text-[12px]"
                        UNSAFE_style={{
                          marginLeft: "-5px",
                        }}
                      >
                        Show Grids
                      </Text>
                    </Flex>
                    <ContextualHelp variant="info">
                      <Heading>How to use?</Heading>
                      <Content>
                        <Text>
                          The pixel canvas is a supplementary tool to help you
                          give the model a rough image input to refer to when
                          generating images. You are free to pan and zoom the
                          canvas
                        </Text>
                      </Content>
                    </ContextualHelp>
                  </Flex>
                  <Flex
                    justifyContent={"space-between"}
                    UNSAFE_className="mt-1"
                  >
                    <ToggleButton
                      width={"size-600"}
                      isSelected={brushTool === BrushTool.DOT}
                      onPress={() => {
                        changeBrushTool(BrushTool.DOT);
                      }}
                    >
                      <BrushIcon />
                    </ToggleButton>
                    <ToggleButton
                      isSelected={brushTool === BrushTool.ERASER}
                      width={"size-600"}
                      onPress={() => {
                        changeBrushTool(BrushTool.ERASER);
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
                    {/* <Button
                      width={"size-600"}
                      variant="secondary"
                      onPress={() => clear()}
                    >
                      <DeleteIcon
                        size="XXS"
                        UNSAFE_style={{
                          opacity: 0.5,
                        }}
                      />
                    </Button> */}
                  </Flex>
                  <Slider
                    labelPosition="side"
                    label="brush size"
                    showValueLabel={false}
                    UNSAFE_className="mt-1"
                    defaultValue={1}
                    value={brushSize}
                    onChange={(value) => {
                      setBrushSize(value);
                    }}
                    minValue={1}
                    maxValue={5}
                  />
                  <ColorWheel
                    size={130}
                    UNSAFE_className="my-5 mx-auto"
                    defaultValue="hsl(30, 100%, 50%)"
                    value={changingColor}
                    onChange={(color) => {
                      setChangingColor(color);
                      changeBrushTool(BrushTool.DOT);
                    }}
                    onChangeEnd={setFinalValue}
                  />

                  <Flex direction="column">
                    <Text UNSAFE_className="text-xs mb-1">
                      Recently Used Colors
                    </Text>
                    <Flex gap="size-100" wrap>
                      {Array.from(recentlyUsedColors).map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full`}
                          style={{
                            backgroundColor: color,
                          }}
                          onClick={() => {
                            const newColor = parseColor(color);
                            changeBrushTool(BrushTool.DOT);
                            setFinalValue(newColor);
                          }}
                        />
                      ))}
                    </Flex>
                  </Flex>
                </div>
              </div>
            )}
          </div>
        </Flex>
      </div>
      <Flex direction="column" gap="size-100" UNSAFE_className="mt-4">
        <Text UNSAFE_className="text-lg font-bold">Generated Images</Text>
        <div className="grid grid-cols-2 gap-1em lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1600px]">
          {galleryImage.map((image) => (
            <Image
              UNSAFE_className="mb-4"
              alt={"image"}
              key={image}
              src={image}
              width={300}
              height={300}
            />
          ))}
        </div>
      </Flex>
    </main>
  );
}
