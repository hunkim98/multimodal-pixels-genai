import Image from "next/image";
import { Inter } from "next/font/google";
import { Button, Flex, TextField, Text } from "@adobe/react-spectrum";
import ChveronRightMedium from "@spectrum-icons/ui/ChevronRightMedium";
import { BrushTool, Dotting, DottingRef, useBrush, useDotting } from "dotting";
import { parseColor } from "@react-stately/color";

import { useCallback, useEffect, useRef, useState } from "react";
import { ColorWheel } from "@react-spectrum/color";
import { generateOutputs } from "@/utils/kandinsky";
import { ModelInputs } from "@/types/replicate";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [inputPrompt, setInputPrompt] = useState(
    "A robot sitting on the ground"
  );
  const [isPixelCanvasOpen, setIsPixelCanvasOpen] = useState(false);
  const dottingRef = useRef<DottingRef>(null);
  let [currentValue, setCurrentValue] = useState(
    parseColor("hsl(50, 100%, 50%)")
  );
  let [finalValue, setFinalValue] = useState(parseColor("hsl(50, 100%, 50%)"));
  const { clear, setData } = useDotting(dottingRef);
  const { changeBrushColor, changeBrushTool, brushTool } = useBrush(dottingRef);
  const [output, setOutput] = useState<object>();
  const [galleryImage, setGalleryImages] = useState<Array<string>>([]);
  const [modelInputs, setModelInputs] = useState<ModelInputs>({
    prompt: "A robot sitting on the ground",
    image: undefined,
  });
  const generateImages = useCallback(() => {
    generateOutputs(modelInputs).then((output) => {
      setOutput(output);
    });
  }, [modelInputs]);

  useEffect(() => {
    changeBrushColor(finalValue.toString("hex"));
  }, [finalValue, changeBrushColor]);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
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
              {isPixelCanvasOpen ? "Close" : "Open"} Supplementary Pixel Canvas
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
        <Flex>
          <Button variant="primary" onPress={clear}>
            Clear
          </Button>
        </Flex>
      </Flex>
    </main>
  );
}
