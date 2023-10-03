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
  Checkbox,
  ButtonGroup,
} from "@adobe/react-spectrum";

import { PixelModifyItem } from "dotting";
import { parseColor } from "@react-stately/color";

import { useCallback, useEffect, useRef, useState } from "react";
import { ColorWheel } from "@react-spectrum/color";
import { ModelInputs } from "@/types/replicate";
import axios from "axios";
import { imageFileUpload } from "@/utils/upload";
import { blobToBase64, createImageOutOfNestedColorArray } from "@/utils/image";

import OutlineCanvas from "@/components/SketchCanvas";
import BrushCanvas from "@/components/BrushCanvas";
import PixelCanvas from "@/components/PixelCanvas/PixelCanvas";
import { BrushData } from "@/components/BrushCanvas/Editor";
import SketchCanvas from "@/components/SketchCanvas";
import ShapeCanvas from "@/components/ShapeCanvas";

const inter = Inter({ subsets: ["latin"] });

enum AssistiveImageInputType {
  BRUSH = "brush",
  PIXELS = "pixels",
  SHAPE = "shape",
  PEN = "PEN",
}

export default function Home() {
  const [isAssistiveCanvasOpen, setIsAssistiveCanvasOpen] = useState(false);
  const [initialPixelDataArray, setInitialPixelDataArray] =
    useState<Array<Array<PixelModifyItem>>>();
  const [initialBrushData, setInitialBrushData] = useState<{
    canvasHeight: number;
    canvasWidth: number;
    canvasLeftTopX: number;
    canvasLeftTopY: number;
    data: BrushData;
  }>();
  const [initialSketchData, setInitialSketchData] = useState<{
    canvasHeight: number;
    canvasWidth: number;
    canvasLeftTopX: number;
    canvasLeftTopY: number;
    data: BrushData;
  }>();
  const [brushCanvasImageBlob, setBrushCanvasImageBlob] = useState<Blob>();
  const [sketchCanvasImageBlob, setSketchCanvasImageBlob] = useState<Blob>();

  const [isModelActive, setIsModelActive] = useState(false);
  const [selectedAsssistivImageInputType, setSelectedAssistiveImageInputType] =
    useState<AssistiveImageInputType>(AssistiveImageInputType.SHAPE);
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
    (baseUrl?: string) => {
      axios
        .post("/api/replicate", { ...modelInputs, image: baseUrl })
        .then(res => {
          if (typeof res.data === "string") {
            return;
          }
          const images = res.data as Array<string>;
          setGalleryImages(prev => [...prev, ...images]);
          setIsModelActive(false);
        })
        .catch(err => {
          setIsModelActive(false);
        });
    },
    [modelInputs],
  );

  // useEffect(() => {
  //   if (!initialPixelDataArray) {
  //     return;
  //   }
  //   const tempCanvas = document.createElement("canvas");
  //   tempCanvas.width = 256;
  //   tempCanvas.height = 256;
  //   const ctx = tempCanvas.getContext("2d");

  //   const base64String = createImageOutOfNestedColorArray(
  //     initialPixelDataArray,
  //   );
  //   var img = new Image();
  //   img.onload = function () {
  //     ctx!.drawImage(img, 0, 0);
  //   };

  //   img.src = URL.createObjectURL(base64String as any);
  //   document.body.appendChild(tempCanvas);
  // }, [initialPixelDataArray]);

  return (
    <main className={`flex min-h-screen flex-col p-24 ${inter.className}`}>
      <div className="flex flex-row justify-center align-middle">
        <Flex direction="column" gap="size-100">
          <Flex gap="size-100">
            <TextField
              label="Start with a detailed description"
              width={"size-6000"}
              value={modelInputs.prompt}
              onChange={value => {
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
                if (!isAssistiveCanvasOpen) {
                  generateImages();
                } else {
                  if (
                    selectedAsssistivImageInputType ===
                    AssistiveImageInputType.PIXELS
                  ) {
                    if (initialPixelDataArray) {
                      blobToBase64(
                        createImageOutOfNestedColorArray(initialPixelDataArray),
                      )
                        .then(base64String => {
                          generateImages(base64String as string);
                        })
                        .catch(err => {
                          setIsModelActive(false);
                        });
                      return;
                    }
                  }
                  if (
                    selectedAsssistivImageInputType ===
                    AssistiveImageInputType.BRUSH
                  ) {
                    if (brushCanvasImageBlob) {
                      blobToBase64(brushCanvasImageBlob)
                        .then(base64String => {
                          generateImages(base64String as string);
                        })
                        .catch(err => {
                          setIsModelActive(false);
                        });
                      return;
                    }
                  }
                  generateImages();
                }
                // setIsAssistiveCanvasOpen(false);
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
            onClick={() => setIsAssistiveCanvasOpen(!isAssistiveCanvasOpen)}
          >
            <Checkbox
              isSelected={isAssistiveCanvasOpen}
              onChange={setIsAssistiveCanvasOpen}
            >
              <Text
                UNSAFE_style={{
                  fontWeight: "bold",
                }}
              >
                Generate Images with supplementary input images
              </Text>
            </Checkbox>
            {isAssistiveCanvasOpen && (
              <>
                <Flex gap="size-100" UNSAFE_className="mb-1">
                  <ToggleButton
                    isSelected={
                      selectedAsssistivImageInputType ===
                      AssistiveImageInputType.SHAPE
                    }
                    UNSAFE_style={{
                      fontWeight: "bold",
                    }}
                    onPressChange={() => {
                      setSelectedAssistiveImageInputType(
                        AssistiveImageInputType.SHAPE,
                      );
                    }}
                  >
                    Shape Tool
                  </ToggleButton>
                  <ToggleButton
                    isSelected={
                      selectedAsssistivImageInputType ===
                      AssistiveImageInputType.BRUSH
                    }
                    UNSAFE_style={{
                      fontWeight: "bold",
                    }}
                    onPressChange={() => {
                      setSelectedAssistiveImageInputType(
                        AssistiveImageInputType.BRUSH,
                      );
                    }}
                  >
                    Color Brush
                  </ToggleButton>
                  <ToggleButton
                    isSelected={
                      selectedAsssistivImageInputType ===
                      AssistiveImageInputType.PIXELS
                    }
                    UNSAFE_style={{
                      fontWeight: "bold",
                    }}
                    onPressChange={() => {
                      setSelectedAssistiveImageInputType(
                        AssistiveImageInputType.PIXELS,
                      );
                    }}
                  >
                    Pixel Squares
                  </ToggleButton>
                </Flex>
                <div
                  className={`flex bg-white rounded-md overflow-hidden shadow-md mt-2`}
                  onClick={e => e.stopPropagation()}
                >
                  {selectedAsssistivImageInputType ===
                    AssistiveImageInputType.PIXELS && (
                    <PixelCanvas
                      initialData={initialPixelDataArray}
                      setInitialData={setInitialPixelDataArray}
                    />
                  )}
                  {selectedAsssistivImageInputType ===
                    AssistiveImageInputType.BRUSH && (
                    <BrushCanvas
                      canvasWidth={initialBrushData?.canvasWidth}
                      canvasHeight={initialBrushData?.canvasHeight}
                      canvasLeftTopX={initialBrushData?.canvasLeftTopX}
                      canvasLeftTopY={initialBrushData?.canvasLeftTopY}
                      initData={initialBrushData?.data}
                      setInitialBrushData={setInitialBrushData}
                      setBrushCanvasImageBlob={setBrushCanvasImageBlob}
                    />
                  )}
                  {selectedAsssistivImageInputType ===
                    AssistiveImageInputType.SHAPE && <ShapeCanvas />}
                </div>
              </>
            )}
          </div>
        </Flex>
      </div>
      <Flex direction="column" gap="size-100" UNSAFE_className="mt-4">
        <Text UNSAFE_className="text-lg font-bold">Generated Images</Text>
        <div className="grid grid-cols-2 gap-1em lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1600px]">
          {galleryImage.map(image => (
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
