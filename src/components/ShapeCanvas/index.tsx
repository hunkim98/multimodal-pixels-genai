import React, { useContext, useEffect, useState } from "react";
import { fabric } from "fabric";
import {
  Button,
  Content,
  ContextualHelp,
  Flex,
  Heading,
  Slider,
  Switch,
  Text,
  ToggleButton,
} from "@adobe/react-spectrum";
import BrushIcon from "@spectrum-icons/workflow/Brush";
import EraserIcon from "@spectrum-icons/workflow/Erase";
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";
import RectangleIcon from "@spectrum-icons/workflow/Rectangle";
import SelectIcon from "@spectrum-icons/workflow/Select";
import CircleIcon from "@spectrum-icons/workflow/Circle";
import { ColorWheel } from "@react-spectrum/color";
import { parseColor } from "@react-stately/color";
import Editor, { ShapeEditorRef } from "./Editor";
import { TriangleIcon } from "./icons";
import { ImageContext } from "../context/ImageContext";

const ShapeCanvas = () => {
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const editorRef = React.useRef<ShapeEditorRef>(null);
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  useEffect(() => {
    const newColor = finalSelectedColor;
    editorRef.current?.colorSelectedShape(newColor.toString("hex"));
    editorRef.current?.recordInHistory();
  }, [finalSelectedColor]);
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set(),
  );
  const [shapeType, setShapeType] = useState<
    "rect" | "ellipse" | "triangle" | undefined
  >(undefined);

  const { setBase64Image } = useContext(ImageContext);

  return (
    <Flex direction="row" gap="size-100">
      <div>
        <Editor
          ref={editorRef}
          shapeType={shapeType}
          color={finalSelectedColor.toString("hex")}
          // undoHistory={undoHistory}
          // redoHistory={redoHistory}
        />
      </div>
      <div className="relative flex flex-col align-middle px-3 py-3 w-[250px] h-[320px]">
        {/* <Flex justifyContent={"space-between"} alignItems={"center"}>
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
            isSelected={shapeType === "rect"}
            onPress={() => {
              setShapeType("rect");
            }}
          >
            <RectangleIcon />
          </ToggleButton>
          <ToggleButton
            isSelected={shapeType === "ellipse"}
            width={"size-600"}
            onPress={() => {
              setShapeType("ellipse");
            }}
          >
            <CircleIcon />
          </ToggleButton>
          <ToggleButton
            isSelected={shapeType === "triangle"}
            width={"size-600"}
            onPress={() => {
              setShapeType("triangle");
            }}
          >
            <TriangleIcon />
          </ToggleButton>
          <ToggleButton
            width={"size-600"}
            isSelected={shapeType === undefined}
            onPress={() => {
              setShapeType(undefined);
            }}
          >
            <SelectIcon />
          </ToggleButton>
          <Button
            variant="secondary"
            onPress={() => {
              // undo();
              editorRef.current?.undo();
            }}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              // redo();
              editorRef.current?.redo();
            }}
          >
            <RedoIcon />
          </Button>
        </Flex>
        {/* <Slider
          labelPosition="side"
          label="brush size"
          showValueLabel={false}
          UNSAFE_className="mt-1"
          defaultValue={1}
          // value={brushSize}
          onChange={value => {
            // setBrushSize(value);
          }}
          minValue={1}
          maxValue={5}
        /> */}
        <ColorWheel
          size={130}
          UNSAFE_className="my-5 mx-auto"
          defaultValue="hsl(30, 100%, 50%)"
          value={changingColor}
          onChange={color => {
            setChangingColor(color);
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
                  setFinalSelectedColor(newColor);
                }}
              />
            ))}
          </Flex>
        </Flex>
        <Button
          variant="cta"
          onPress={() => {
            const imageBase = editorRef.current?.getBase64Image();
            console.log(imageBase);
          }}
        >
          download
        </Button>
      </div>
    </Flex>
  );
};

export default ShapeCanvas;
