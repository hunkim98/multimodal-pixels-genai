import Image from "next/image";
import { Inter } from "next/font/google";
import { Button, Flex, TextField, Text } from "@adobe/react-spectrum";
import ChveronRightMedium from "@spectrum-icons/ui/ChevronRightMedium";
import { Dotting } from "dotting";

import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [inputPrompt, setInputPrompt] = useState(
    "A robot sitting on the ground"
  );
  const [isPixelCanvasOpen, setIsPixelCanvasOpen] = useState(false);
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <Flex direction="column" gap="size-100">
        <Flex gap="size-100">
          <TextField
            label="Start with a detailed description"
            width={"size-6000"}
            value={inputPrompt}
            onChange={setInputPrompt}
          />
          <Button variant="accent" alignSelf={"end"}>
            Generate
          </Button>
        </Flex>
        <div onClick={() => setIsPixelCanvasOpen(!isPixelCanvasOpen)}>
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
        </div>
        {isPixelCanvasOpen && <Dotting width={300} height={300} />}
      </Flex>
    </main>
  );
}
