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
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
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
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ImageExportRef } from "@/types/imageExportRef";
import { CanvasContextProvider } from "@/components/PathCanvas/canvasContext";
import { ImageContext } from "@/components/context/ImageContext";
import { KandinskyBody } from "@/utils/types";
import ImageComponent from "@/components/ImageComponent";
import Settings from "@spectrum-icons/workflow/Settings";

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
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/2b14af4a-1cf9-4738-870d-610c93961def-image.png",
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/07cfe359-de1a-479c-829b-2d2ec8a2d6c5-image.png",
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/96f0f0b5-df1b-4dd8-9afc-9f4aa19a40b4-image.png",
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/9ee9d9df-c2ec-49e4-aaff-19d4c2328bdc-image.png",
    "https://pickgeul-asset.s3.ap-northeast-1.amazonaws.com/756e4d6c-349c-4dbc-9de8-48d44498298d-image.png",
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

  const router = useRouter();

  return (
    <main className={`${inter.className}`}>
      <Flex UNSAFE_className="px-2 py-2">
        <MenuTrigger>
          <ActionButton aria-label="Others">
            <Settings />
          </ActionButton>
          <Menu
            selectedKeys={[selectedAsssistivImageInputType]}
            onAction={key => {
              if (key === "textonly") {
                setIsAssistiveCanvasOpen(false);
                setSelectedAssistiveImageInputType(
                  AssistiveImageInputType.NULL,
                );
              } else {
                setIsAssistiveCanvasOpen(true);
                setSelectedAssistiveImageInputType(
                  key as AssistiveImageInputType,
                );
                router.push(`?editor=${key}`);
              }
            }}
          >
            <Item key={AssistiveImageInputType.NULL}>text-only</Item>
            <Item key={AssistiveImageInputType.BRUSH}>brush</Item>
            <Item key={AssistiveImageInputType.PIXELS}>pixels</Item>
            <Item key={AssistiveImageInputType.SHAPE}>shape</Item>
            <Item key={AssistiveImageInputType.PATH}>path</Item>
          </Menu>
        </MenuTrigger>
      </Flex>
      <div className="flex min-h-screen flex-col px-24 relative">
        {/* <div className="absolute top-0 left-0">
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
      </div> */}
        <div className="flex flex-row justify-center align-middle fixed z-10 bottom-5 left-1/2 transform -translate-x-1/2">
          <Flex direction="column" gap="size-100">
            {selectedAsssistivImageInputType !==
              AssistiveImageInputType.NULL && (
              <div className="z-50">
                <>
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

            <Flex
              direction={"column"}
              UNSAFE_className="bg-white bg-opacity-80 px-4 py-3 rounded-md shadow-md"
              width={578}
            >
              {selectedAsssistivImageInputType !==
                AssistiveImageInputType.NULL && (
                <Flex alignItems={"center"}>
                  <Checkbox
                    isEmphasized={true}
                    // UNSAFE_className="bg-blue-100"
                    isSelected={isAssistiveCanvasOpen}
                    onChange={setIsAssistiveCanvasOpen}
                  >
                    {isAssistiveCanvasOpen ? "Close Canvas" : "Open Canvas"}
                  </Checkbox>
                </Flex>
              )}
              <Flex gap="size-100">
                <TextField
                  // label="Start with a detailed description"
                  // width={"size-6000"}
                  width={"100%"}
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
            </Flex>
          </Flex>
        </div>
        <Flex direction="column" gap="size-100" UNSAFE_className="mt-4">
          <Text UNSAFE_className="text-lg font-bold">Generated Images</Text>
          {/* <div style={{}}>
          <DynamicComponentWithNoSSR />
        </div> */}
          <div className="grid grid-cols-2 gap-1em lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 max-w-[1600px]">
            {galleryImage.map(image => (
              <ImageComponent
                key={image}
                image={image}
                setImageUrlToEdit={setImageUrlToEdit}
                setIsAssistiveCanvasOpen={setIsAssistiveCanvasOpen}
              />
              // <div key={image} className="relative">
              //   <Image
              //     UNSAFE_className="mb-4"
              //     alt={"image"}
              //     key={image}
              //     src={image}
              //     width={300}
              //     height={300}
              //   />
              //   <Button
              //     variant="secondary"
              //     // UNSAFE_className="absolute top-0 right-0"
              //     UNSAFE_className="bg-white"
              //     UNSAFE_style={{
              //       position: "absolute",
              //       top: 5,
              //       left: 5,
              //       color: "#fff",
              //     }}
              //     onPress={() => {
              //       setImageUrlToEdit(image);
              //       setIsAssistiveCanvasOpen(true);
              //     }}
              //   >
              //     Edit
              //   </Button>
              // </div>
            ))}
          </div>
        </Flex>
      </div>
    </main>
  );
}
