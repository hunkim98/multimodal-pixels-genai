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

import {
  LegacyRef,
  Ref,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImageExportRef } from "@/types/imageExportRef";
import { CanvasContextProvider } from "@/components/PathCanvas/canvasContext";
import { ImageContext } from "@/components/context/ImageContext";
import { KandinskyBody } from "@/utils/types";

const inter = Inter({ subsets: ["latin"] });

enum AssistiveImageInputType {
  BRUSH = "brush",
  PIXELS = "pixels",
  SHAPE = "shape",
  PATH = "path",
  NULL = "null",
}

const PathCanvas = dynamic(
  async () => {
    const { default: PathCanvas } = await import(
      "../components/PathCanvas/Editor"
    );
    const PathCanvasComponent = ({
      forwardedRef,
    }: {
      forwardedRef: Ref<ImageExportRef>;
    }) => {
      return <PathCanvas ref={forwardedRef} />;
    };
    return PathCanvasComponent;
  },
  { ssr: false },
);

export default function Home() {
  const searchParams = useSearchParams();
  const imageInputType = searchParams.get("editor");
  useEffect(() => {
    console.log(imageInputType);
    if (imageInputType) {
      switch (imageInputType) {
        case AssistiveImageInputType.BRUSH:
          setIsAssistiveCanvasOpen(true);
          setSelectedAssistiveImageInputType(AssistiveImageInputType.BRUSH);
          break;
        case AssistiveImageInputType.PIXELS:
          setIsAssistiveCanvasOpen(true);
          setSelectedAssistiveImageInputType(AssistiveImageInputType.PIXELS);
          break;
        case AssistiveImageInputType.SHAPE:
          setIsAssistiveCanvasOpen(true);
          setSelectedAssistiveImageInputType(AssistiveImageInputType.SHAPE);
          break;
        case AssistiveImageInputType.PATH:
          setIsAssistiveCanvasOpen(true);
          setSelectedAssistiveImageInputType(AssistiveImageInputType.PATH);
          break;
        default:
          setIsAssistiveCanvasOpen(false);
          setSelectedAssistiveImageInputType(AssistiveImageInputType.NULL);
      }
    } else {
      setIsAssistiveCanvasOpen(false);
      setSelectedAssistiveImageInputType(AssistiveImageInputType.NULL);
    }
  }, [imageInputType]);
  const { setImageUrlToEdit, imageUrlToEdit } = useContext(ImageContext);
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
  const [brushCanvasImageBlob, setBrushCanvasImageBlob] = useState<Blob>();

  const [isModelActive, setIsModelActive] = useState(false);
  const imageExportUtilRef = useRef<ImageExportRef>(null);
  const [selectedAsssistivImageInputType, setSelectedAssistiveImageInputType] =
    useState<AssistiveImageInputType>(AssistiveImageInputType.NULL);
  const [galleryImage, setGalleryImages] = useState<Array<string>>([
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/824587c6-c0b1-4b5c-9eb3-f6e92715f38a-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/2b14af4a-1cf9-4738-870d-610c93961def-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/07cfe359-de1a-479c-829b-2d2ec8a2d6c5-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/96f0f0b5-df1b-4dd8-9afc-9f4aa19a40b4-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/9ee9d9df-c2ec-49e4-aaff-19d4c2328bdc-image.png",
    // "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/756e4d6c-349c-4dbc-9de8-48d44498298d-image.png",
  ]);
  useEffect(() => {
    // access local storage
    const localData = localStorage.getItem("generated_images");
    if (localData) {
      setGalleryImages(JSON.parse(localData));
    }
  }, [setGalleryImages]);
  const [modelInputs, setModelInputs] = useState<ModelInputs>({
    prompt: "A robot sitting on the ground",
  });
  const generateImages = useCallback(
    ({
      type,
      image,
      mask,
    }: {
      type: "text2img" | "img2img" | "inpainting";
      image?: string;
      mask?: string;
    }) => {
      const body: KandinskyBody = {
        prompt: modelInputs.prompt,
        image: image,
        mask: mask,
        type,
      };
      axios
        .post("/genapi/kandinsky2", body)
        .then(res => {
          if (typeof res.data === "string") {
            return;
          }
          const images = res.data.images as Array<string>;
          setGalleryImages(prev => {
            localStorage.setItem(
              "generated_images",
              JSON.stringify([...prev, ...images]),
            );
            return [...prev, ...images];
          });
          setIsModelActive(false);
        })
        .catch(err => {
          setIsModelActive(false);
        });
    },
    [modelInputs],
  );

  const onClickGenerateButton = async () => {
    const userImage = await imageExportUtilRef.current?.getBase64Image();
    // download
    // const a = document.createElement("a");
    // a.href = userImage;
    // a.download = "myImage.png";
    // a.click();
    // return;
    if (!isAssistiveCanvasOpen) {
      generateImages({ type: "text2img" });
    } else {
      if (!userImage) return;
      const base64Img = userImage.split(",")[1];
      if (!imageUrlToEdit) {
        generateImages({ type: "img2img", image: base64Img });
      } else {
        generateImages({
          type: "inpainting",
          mask: base64Img,
          image: imageUrlToEdit,
        });
      }
    }
  };

  useEffect(() => {
    if (!isAssistiveCanvasOpen) {
      setImageUrlToEdit(undefined);
    }
  }, [isAssistiveCanvasOpen]);

  return (
    <main className={`flex min-h-screen flex-col p-24 ${inter.className}`}>
      <div className="absolute top-0 left-0">
        <Link href="/">
          <Button variant="secondary">Basic</Button>
        </Link>

        <Link href={`?editor=${AssistiveImageInputType.BRUSH}`}>
          <Button variant="secondary">Brush</Button>
        </Link>

        <Link href={`?editor=${AssistiveImageInputType.PIXELS}`}>
          <Button variant="secondary">Pixels</Button>
        </Link>

        <Link href={`?editor=${AssistiveImageInputType.SHAPE}`}>
          <Button variant="secondary">Shape</Button>
        </Link>

        <Link href={`?editor=${AssistiveImageInputType.PATH}`}>
          <Button variant="secondary">Path</Button>
        </Link>
      </div>
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
              onPress={async () => {
                setIsModelActive(true);
                onClickGenerateButton();
                // const base64 =
                //   await imageExportUtilRef.current?.getBase64Image();
                // if (base64) {
                //   //download
                //   const a = document.createElement("a");
                //   a.href = base64;
                //   a.download = "myImage.png";
                //   a.click();
                // }
              }}
            >
              {isModelActive ? (
                <ProgressCircle
                  size="S"
                  aria-label="Loading…"
                  isIndeterminate
                />
              ) : (
                <> {imageUrlToEdit ? "Edit" : "Generate"}</>
              )}
            </Button>
          </Flex>
          {selectedAsssistivImageInputType !== AssistiveImageInputType.NULL && (
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
              <>
                {/* <Flex gap="size-100" UNSAFE_className="mb-1">
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
                <ToggleButton
                  isSelected={
                    selectedAsssistivImageInputType ===
                    AssistiveImageInputType.PATH
                  }
                  UNSAFE_style={{
                    fontWeight: "bold",
                  }}
                  onPressChange={() => {
                    setSelectedAssistiveImageInputType(
                      AssistiveImageInputType.PATH,
                    );
                  }}
                >
                  Path Tool
                </ToggleButton>
              </Flex> */}
                {isAssistiveCanvasOpen && (
                  <div
                    className={`flex bg-white rounded-md overflow-hidden shadow-md mt-2`}
                    onClick={e => e.stopPropagation()}
                  >
                    {selectedAsssistivImageInputType ===
                      AssistiveImageInputType.PIXELS && (
                      <PixelCanvas
                        ref={imageExportUtilRef}
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
                        ref={imageExportUtilRef}
                      />
                    )}
                    {selectedAsssistivImageInputType ===
                      AssistiveImageInputType.SHAPE && (
                      <ShapeCanvas ref={imageExportUtilRef} />
                    )}
                    {selectedAsssistivImageInputType ===
                      AssistiveImageInputType.PATH && (
                      <CanvasContextProvider>
                        <PathCanvas forwardedRef={imageExportUtilRef} />
                      </CanvasContextProvider>
                    )}
                  </div>
                )}
              </>
            </div>
          )}
        </Flex>
      </div>
      <Flex direction="column" gap="size-100" UNSAFE_className="mt-4">
        <Text UNSAFE_className="text-lg font-bold">Generated Images</Text>
        {/* <div style={{}}>
          <DynamicComponentWithNoSSR />
        </div> */}
        <div className="grid grid-cols-2 gap-1em lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1600px]">
          {galleryImage.map(image => (
            <div key={image} className="relative">
              <Image
                UNSAFE_className="mb-4"
                alt={"image"}
                key={image}
                src={image}
                width={300}
                height={300}
              />
              <Button
                variant="secondary"
                // UNSAFE_className="absolute top-0 right-0"
                UNSAFE_className="bg-white"
                UNSAFE_style={{
                  position: "absolute",
                  top: 5,
                  left: 5,
                  color: "#fff",
                }}
                onPress={() => {
                  setImageUrlToEdit(image);
                  setIsAssistiveCanvasOpen(true);
                }}
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      </Flex>
    </main>
  );
}
