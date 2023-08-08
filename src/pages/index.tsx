import { Inter } from "next/font/google";
import {
  Button,
  Flex,
  TextField,
  Text,
  Image,
  Heading,
} from "@adobe/react-spectrum";
import ChveronRightMedium from "@spectrum-icons/ui/ChevronRightMedium";
import {
  BrushTool,
  CanvasDataChangeParams,
  Dotting,
  DottingData,
  DottingRef,
  PixelModifyItem,
  useBrush,
  useData,
  useDotting,
} from "dotting";
import { parseColor } from "@react-stately/color";

import { useCallback, useEffect, useRef, useState } from "react";
import { ColorWheel } from "@react-spectrum/color";
import { generateOutputs } from "@/utils/kandinsky";
import { ModelInputs } from "@/types/replicate";
import axios from "axios";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [isPixelCanvasOpen, setIsPixelCanvasOpen] = useState(false);
  const dottingRef = useRef<DottingRef>(null);
  let [currentValue, setCurrentValue] = useState(
    parseColor("hsl(50, 100%, 50%)")
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<string[]>([]);
  const [userDataArray, setUserDataArray] =
    useState<Array<Array<PixelModifyItem>>>();
  let [finalValue, setFinalValue] = useState(parseColor("hsl(50, 100%, 50%)"));
  const { dataArray, data } = useData(dottingRef);
  const { clear, setData } = useDotting(dottingRef);
  const { changeBrushColor, changeBrushTool, brushTool } = useBrush(dottingRef);
  const [galleryImage, setGalleryImages] = useState<Array<string>>([]);
  const [modelInputs, setModelInputs] = useState<ModelInputs>({
    prompt: "A robot sitting on the ground",
    image: undefined,
  });
  const generateImages = useCallback(() => {
    axios.post("/api/replicate", modelInputs).then((res) => {
      const images = res.data as Array<string>;
      console.log(res.data as Array<string>);
      setGalleryImages((prev) => [...prev, ...images]);

      // setGalleryImages(res.data);
    });
    // generateOutputs(modelInputs).then((output) => {
    //   setOutput(output);
    // });
  }, [modelInputs]);

  useEffect(() => {
    const listener = ({ data }: CanvasDataChangeParams) => {
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
    const dottingRefCurrnet = dottingRef.current;
    dottingRefCurrnet?.addDataChangeListener(listener);
    // return () => {
    //   if (dottingRefCurrnet) {
    //     dottingRefCurrnet?.removeDataChangeListener(listener);
    //   }
    // };
  }, [isPixelCanvasOpen, dottingRef]);

  useEffect(() => {
    console.log("heyhyh");
  }, [dataArray]);

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
            <Button variant="accent" alignSelf={"end"} onPress={generateImages}>
              Generate
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
                {isPixelCanvasOpen ? "Close" : "Open"} Supplementary Pixel
                Canvas
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
                    width={300}
                    height={300}
                    initData={userDataArray}
                    style={{
                      border: "none",
                    }}
                  />
                </div>
                <div className="flex flex-col align-middle px-5 pt-3">
                  <Flex gap={"size-100"}>
                    <Button
                      variant="primary"
                      onPress={() => {
                        if (brushTool === BrushTool.ERASER) {
                          changeBrushTool(BrushTool.DOT);
                        } else {
                          changeBrushTool(BrushTool.ERASER);
                        }
                      }}
                    >
                      Brush
                    </Button>
                    <Button variant="primary" onPress={() => clear()}>
                      Clear
                    </Button>
                  </Flex>
                  <ColorWheel
                    defaultValue="hsl(30, 100%, 50%)"
                    onChange={setCurrentValue}
                    onChangeEnd={setFinalValue}
                  />
                  <Flex>
                    <Text>Brush</Text>
                  </Flex>
                </div>
              </div>
            )}
          </div>
        </Flex>
      </div>
      <Flex direction="column" gap="size-100" UNSAFE_className="mt-4">
        <Text UNSAFE_className="text-lg font-bold">Generated Images</Text>
        <Flex gap="size-100">
          {galleryImage.map((image) => (
            <Image
              alt={"image"}
              key={image}
              src={image}
              width={300}
              height={300}
            />
          ))}
        </Flex>
      </Flex>
    </main>
  );
}
