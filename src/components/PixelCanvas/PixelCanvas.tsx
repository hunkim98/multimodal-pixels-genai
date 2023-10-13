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
import { parseColor } from "@react-stately/color";
import {
  BrushTool,
  CanvasDataChangeHandler,
  CanvasStrokeEndHandler,
  Dotting,
  DottingRef,
  PixelModifyItem,
  useBrush,
  useDotting,
  useHandlers,
} from "dotting";
import React, { useEffect, useRef, useState } from "react";
import {
  brushSizeFive,
  brushSizeFour,
  brushSizeOne,
  brushSizeThree,
  brushSizeTwo,
} from "@/utils/brush";
import BrushIcon from "@spectrum-icons/workflow/Brush";
import EraserIcon from "@spectrum-icons/workflow/Erase";
import DeleteIcon from "@spectrum-icons/workflow/Delete";
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";
import { ColorWheel } from "@react-spectrum/color";
import { CreateEmptySquareData } from "@/utils/dataCreator";

interface Props {
  initialData?: Array<Array<PixelModifyItem>>;
  setInitialData: React.Dispatch<
    React.SetStateAction<Array<Array<PixelModifyItem>> | undefined>
  >;
}
function PixelCanvas({ initialData, setInitialData }: Props) {
  const dottingRef = useRef<DottingRef>(null);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const { clear, undo, redo } = useDotting(dottingRef);
  const { changeBrushColor, changeBrushTool, changeBrushPattern, brushTool } =
    useBrush(dottingRef);
  const [brushSize, setBrushSize] = useState(1);
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set(),
  );

  const {
    addDataChangeListener,
    addStrokeEndListener,
    addBrushChangeListener,
    removeStrokeEndListener,
  } = useHandlers(dottingRef);

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
      setInitialData(tempArray);
    };
    addDataChangeListener(dataChangeListener);
  }, [setInitialData, addDataChangeListener]);

  useEffect(() => {
    const strokeEndListener: CanvasStrokeEndHandler = ({
      strokedPixels,
      strokeTool,
    }) => {
      if (strokeTool === BrushTool.DOT) {
        const color = strokedPixels[strokedPixels.length - 1].color;
        setRecentlyUsedColors(prev => {
          const newSet = new Set(prev);
          newSet.add(color);
          return newSet;
        });
      }
    };
    addStrokeEndListener(strokeEndListener);
    return () => {
      removeStrokeEndListener(strokeEndListener);
    };
  }, [addStrokeEndListener, removeStrokeEndListener]);

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
    changeBrushColor(finalSelectedColor.toString("hex"));
  }, [finalSelectedColor, changeBrushColor]);

  return (
    <Flex direction="row" gap="size-100">
      <div className="bg-white">
        <Dotting
          ref={dottingRef}
          width={320}
          height={320}
          isGridFixed={true}
          initLayers={[
            {
              id: "default",
              data: CreateEmptySquareData(32),
            },
          ]}
          gridSquareLength={10}
          isGridVisible={isGridVisible}
          isPanZoomable={false}
          style={{
            border: "none",
          }}
        />
      </div>
      <div className="relative flex flex-col align-middle px-3 py-3 w-[210px] h-[320px]">
        {/* <Flex justifyContent={"space-between"} alignItems={"center"}>
          <Flex alignItems={"center"}>
            <Switch isSelected={isGridVisible} onChange={setIsGridVisible} />
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
        </Flex>
        <Slider
          labelPosition="side"
          label="brush size"
          showValueLabel={false}
          UNSAFE_className="mt-1"
          defaultValue={1}
          value={brushSize}
          onChange={value => {
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
          onChange={color => {
            setChangingColor(color);
            changeBrushTool(BrushTool.DOT);
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
                  changeBrushTool(BrushTool.DOT);
                  setFinalSelectedColor(newColor);
                }}
              />
            ))}
          </Flex>
        </Flex>
      </div>
    </Flex>
  );
}

export default PixelCanvas;
