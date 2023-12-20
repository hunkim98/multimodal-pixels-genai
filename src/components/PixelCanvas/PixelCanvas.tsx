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
import React, {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import { ImageExportRef } from "@/types/imageExportRef";
import { blobToBase64, createImageOutOfNestedColorArray } from "@/utils/image";
import { ImageContext } from "../context/ImageContext";

interface Props {
  initialData?: Array<Array<PixelModifyItem>>;
  setInitialData: React.Dispatch<
    React.SetStateAction<Array<Array<PixelModifyItem>> | undefined>
  >;
}
const PixelCanvas = forwardRef<ImageExportRef, Props>(function Canvas(
  { initialData, setInitialData },
  ref: React.ForwardedRef<ImageExportRef>,
) {
  const dottingRef = useRef<DottingRef>(null);
  const { imageUrlToEdit, setImageUrlToEdit } = useContext(ImageContext);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const {
    clear,
    undo,
    redo,
    getBackgroundCanvas,
    convertWorldPosToCanvasOffset,
  } = useDotting(dottingRef);
  const { changeBrushTool, changeBrushPattern, brushTool } =
    useBrush(dottingRef);
  const [brushSize, setBrushSize] = useState(1);
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Array<string>>(
    [],
  );

  const [dataArray, setDataArray] = useState<Array<Array<PixelModifyItem>>>(
    initialData ?? [],
  );
  useEffect(() => {
    const canvas = getBackgroundCanvas();
    if (imageUrlToEdit) {
      clear();
      setRecentlyUsedColors([]);
      // const image = new Image();
      // image.src = imageUrlToEdit;
      // const gridSquareSize = 10;
      // image.onload = () => {
      //   const { width, height } = image;
      //   const imageWorldPosX = 0;
      //   const imageWorldPosY = 0;

      //   const { x, y } = convertWorldPosToCanvasOffset(
      //     imageWorldPosX,
      //     imageWorldPosY,
      //   );
      //   const canvasWidth = canvas.width;
      //   const canvasHeight = canvas.height;
      //   const imageWidth = gridSquareSize * 32;
      //   const imageHeight = gridSquareSize * 32;
      //   const ratio = Math.min(canvasWidth / width, canvasHeight / height, 1);
      //   const scaledWidth = width * ratio;
      //   const scaledHeight = height * ratio;
      //   const left = (canvasWidth - scaledWidth) / 2;
      //   const top = (canvasHeight - scaledHeight) / 2;
      //   const ctx = canvas.getContext("2d");
      //   ctx?.drawImage(image, x, y, imageWidth, imageHeight);
      // };
    } else {
      const backgroundCanvas = getBackgroundCanvas();
      if (!backgroundCanvas) return;
      const ctx = backgroundCanvas.getContext("2d");
      ctx?.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
      clear();
      setRecentlyUsedColors([]);
    }
  }, [
    imageUrlToEdit,
    getBackgroundCanvas,
    convertWorldPosToCanvasOffset,
    setRecentlyUsedColors,
  ]);

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
      setDataArray(tempArray);
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
          const newArray = Array.from(newSet);
          if (!newSet.has(color)) {
            if (newSet.size >= 6) {
              newArray.pop();
            }
            newArray.unshift(color);
          }
          return newArray;
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

  useImperativeHandle(
    ref,
    () => ({
      getBase64Image: async () => {
        const base64 = await blobToBase64(
          createImageOutOfNestedColorArray(dataArray),
        );
        return base64 as string;
      },
    }),
    [dottingRef.current, dataArray],
  );

  return (
    <Flex direction="row" gap="size-100">
      <div className="bg-white relative">
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
            }}
          />
        )}
        <Dotting
          ref={dottingRef}
          width={320}
          height={320}
          isGridFixed={true}
          brushColor={
            imageUrlToEdit ? "#DDDDDD" : finalSelectedColor.toString("hex")
          }
          backgroundColor="transparent"
          initLayers={[
            {
              id: "default",
              data: CreateEmptySquareData(32),
            },
          ]}
          gridSquareLength={10}
          // backgroundColor="transparent"
          defaultPixelColor={imageUrlToEdit ? "transparent" : "#ffffff"}
          isGridVisible={isGridVisible}
          isPanZoomable={false}
          style={{
            border: "0.5px solid black",
          }}
          initAutoScale={false}
        />
      </div>
      <div className="relative flex flex-col align-middle px-3 py-3 w-[250px] h-[320px]">
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
            changeBrushTool(BrushTool.DOT);
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
                    changeBrushTool(BrushTool.DOT);
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
});

export default PixelCanvas;
