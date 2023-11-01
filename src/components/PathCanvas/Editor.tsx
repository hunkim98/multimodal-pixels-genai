import SvgCanvas from "@svgedit/svgcanvas";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from "react";
import config from "./config";
import { CanvasContextProvider, canvasContext } from "./canvasContext";
import updateCanvas from "./updateCanvas";
import SelectIcon from "@spectrum-icons/workflow/Select";
import FakeImage from "../fakeImage.png";
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
import UndoIcon from "@spectrum-icons/workflow/Undo";
import RedoIcon from "@spectrum-icons/workflow/Redo";
import SliceIcon from "@spectrum-icons/workflow/Slice";
import { ColorWheel } from "@react-spectrum/color";
import { ImageExportRef } from "@/types/imageExportRef";
import { ImageContext } from "../context/ImageContext";

const PathCanvas = forwardRef<ImageExportRef, {}>(function Canvas(
  {},
  ref: React.ForwardedRef<ImageExportRef>,
) {
  const svgcanvasRef = React.useRef<HTMLDivElement>(null);
  const [canvasState, dispatchCanvasState] = React.useContext(canvasContext);
  const { canvas, selectedElement, mode, updated } = canvasState;
  const [svgCanvas, setSvgCanvas] = useState<any>();
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set(),
  );
  const { imageUrlToEdit } = React.useContext(ImageContext);

  const canvasBackground = document.getElementById("canvasBackground");
  if (canvasBackground) {
    canvasBackground.children[0].setAttribute("fill", "transparent");
    canvasBackground.children[0].setAttribute("stroke", "transparent");
  }

  useEffect(() => {
    if (finalSelectedColor) {
      const color = finalSelectedColor.toString("hex");
      dispatchCanvasState({
        type: "color",
        colorType: "fill",
        color: color,
      });
      dispatchCanvasState({ type: "color", colorType: "stroke", color });
    }
  }, [finalSelectedColor, dispatchCanvasState]);

  const setMode = (newMode: string) =>
    dispatchCanvasState({ type: "mode", mode: newMode });

  const updateContextPanel = () => {
    let elem = canvasState.selectedElement;
    // If element has just been deleted, consider it null
    if (elem && !elem.parentNode) {
      elem = null;
    }
    if (elem) {
      const { tagName } = elem;
      // if (tagName === 'text') {
      //   // we should here adapt the context to a text field
      //   textRef.current.value = elem.textContent
      // }
    }
  };

  const onKeyDown = (event: any) => {
    if (event.key === "Backspace" && event.target.tagName !== "INPUT") {
      event.preventDefault();
      dispatchCanvasState({ type: "deleteSelectedElements" });
    }
  };

  useEffect(() => {
    const keyDownListener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        canvas.undoMgr.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        canvas.undoMgr.redo();
      }
    };
    window.addEventListener("keydown", keyDownListener);
    return () => {
      window.removeEventListener("keydown", keyDownListener);
    };
  }, [canvas]);

  useLayoutEffect(() => {
    const editorDom = svgcanvasRef.current;
    // Promise.resolve().then(() => {
    const canvas = new SvgCanvas(editorDom, config);
    setSvgCanvas(canvas);
    updateCanvas(canvas, svgcanvasRef.current, config, true);
    console.log(canvas);
    dispatchCanvasState({ type: "init", canvas, svgcanvas: editorDom, config });
    dispatchCanvasState({ type: "mode", mode: "path" });
    document.addEventListener("keydown", onKeyDown.bind(canvas));
    return () => {
      // cleanup function
      console.log("cleanup");
      document.removeEventListener("keydown", onKeyDown.bind(canvas));
    };
  }, []);
  updateContextPanel();

  const drawImage = async (ctx: CanvasRenderingContext2D, imageUrl: string) => {
    // return a Promise synchronously
    return new Promise((resolve, reject) => {
      const imgToDraw = new Image();
      imgToDraw.src = imageUrl;
      imgToDraw.onload = () => {
        ctx.drawImage(imgToDraw, 0, 0, 512, 512); // expand
        resolve("success");
      };
      imgToDraw.onerror = reject;
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      getBase64Image: async () => {
        if (canvas?.getMode() !== "select") {
          alert("선택영역를 선택해제해주시고 시도해주세요");
          return;
        }
        if (document.getElementById("svgroot")) {
          var s = new XMLSerializer().serializeToString(
            document.getElementById("svgroot")!,
          );
          var encodedData = window.btoa(s);
          const base64 = "data:image/svg+xml;base64," + encodedData;
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d")!;
          await drawImage(ctx, base64);
          return canvas.toDataURL("image/png");
        }
        return "";
      },
    }),
    [svgCanvas, setMode, canvas],
  );
  return (
    <Flex direction="row" gap="size-100">
      <div className="OIe-editor" role="main">
        <div
          className="workarea"
          style={{
            width: "320px",
            height: "320px",
            position: "relative",
            border: "0.5px solid black",

            // background: `linear-gradient(rgba(255,255,255,.5), rgba(255,255,255,.5)), url("fakeImage.png")`,
          }}
        >
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
          <div
            ref={svgcanvasRef}
            className="svgcanvas"
            style={{ position: "relative" }}
          ></div>
        </div>
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
            isSelected={mode !== "path"}
            onPress={() => {
              setMode("select");
            }}
          >
            <SelectIcon />
          </ToggleButton>
          <ToggleButton
            isSelected={mode === "path"}
            width={"size-600"}
            onPress={() => {
              setMode("path");
              // changeBrushTool(BrushTool.ERASER);
            }}
          >
            <SliceIcon />
          </ToggleButton>
          <Button
            variant="secondary"
            onPress={() => {
              canvas.undoMgr.undo();
            }}
          >
            <UndoIcon />
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              canvas.undoMgr.redo();
            }}
          >
            <RedoIcon />
          </Button>
        </Flex>

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
      </div>
    </Flex>
  );
});

// const CanvasWithContext = forwardRef<ImageExportRef, any>(function (
//   props,
//   ref: React.ForwardedRef<ImageExportRef>,
// ) {
//   useImperativeHandle(
//     ref,
//     () => ({
//       getBase64Image: async () => {
//         console.log("hey");
//         return "";
//       },
//     }),
//     [],
//   );
//   return (
//     <CanvasContextProvider>
//       <PathCanvas {...props} ref={ref} />
//     </CanvasContextProvider>
//   );
// });

export default PathCanvas;

// export default DynamicPathCanvas;
