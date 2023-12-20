import SvgCanvas from "@svgedit/svgcanvas";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
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
  const { canvas, mode, updated } = canvasState;
  const containerRef = useRef<HTMLDivElement>(null);

  const [svgCanvas, setSvgCanvas] = useState<any>();
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [isElementSelected, setIsElementSelected] = useState(false);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Array<string>>(
    [],
  );
  const { imageUrlToEdit, setImageUrlToEdit } = React.useContext(ImageContext);
  const canvasBackground = document.getElementById("canvasBackground");
  if (canvasBackground) {
    canvasBackground.children[0].setAttribute("fill", "transparent");
    canvasBackground.children[0].setAttribute("stroke", "transparent");
  }
  const [copiedElements, setCopiedElements] = useState<any[]>([]);
  const [realMode, setRealMode] = useState("path");

  useEffect(() => {
    if (!svgCanvas) return;
    if (imageUrlToEdit) {
      const elements = svgCanvas.getVisibleElements();
      svgCanvas.addToSelection(elements);
      svgCanvas.deleteSelectedElements();
      dispatchCanvasState({ type: "mode", mode: "select" });
      dispatchCanvasState({
        type: "color",
        colorType: "fill",
        color: "#DDDDDD",
      });
      dispatchCanvasState({
        type: "color",
        colorType: "stroke",
        color: "#DDDDDD",
      });
    } else {
      const elements = svgCanvas.getVisibleElements();
      svgCanvas.addToSelection(elements);
      svgCanvas.deleteSelectedElements();
      setRecentlyUsedColors([]);
      dispatchCanvasState({
        type: "color",
        colorType: "fill",
        color: finalSelectedColor.toString("hex"),
      });
      dispatchCanvasState({
        type: "color",
        colorType: "stroke",
        color: finalSelectedColor.toString("hex"),
      });
    }
  }, [imageUrlToEdit, svgCanvas]);

  useEffect(() => {
    const modeListener = setInterval(() => {
      // console.log(canvas?.currentMode);
      setRealMode(canvas?.currentMode);
    }, 500);
    return () => {
      clearInterval(modeListener);
    };
  }, [canvas]);

  useEffect(() => {
    if (finalSelectedColor) {
      const color = finalSelectedColor.toString("hex");
      if (selectedElement) {
        // dispatchCanvasState({
        //   type: "color",
        //   colorType: "fill",
        //   color: color,
        // });
        selectedElement.setAttribute("fill", color);
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
      dispatchCanvasState({
        type: "color",
        colorType: "fill",
        color: color,
      });
      dispatchCanvasState({ type: "color", colorType: "stroke", color });
    }
  }, [
    finalSelectedColor,
    dispatchCanvasState,
    isElementSelected,
    selectedElement,
  ]);

  useEffect(() => {
    if (selectedElement) {
      setRecentlyUsedColors(prev => {
        const newSet = new Set(prev);
        const newArray = Array.from(newSet);
        if (!newSet.has(selectedElement.getAttribute("fill")!)) {
          if (newSet.size >= 6) {
            newArray.pop();
          }
          newArray.unshift(selectedElement.getAttribute("fill")!);
        }
        return newArray;
      });
    }
  }, [selectedElement, finalSelectedColor]);

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
    if ((event.ctrlKey || event.metaKey) && event.key === "z") {
      canvas.undoMgr.undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "y") {
      canvas.undoMgr.redo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "c") {
      setCopiedElements(canvas?.selectedElements);
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "v") {
      if (copiedElements.length !== 0) {
        canvas?.clearSelection();
        canvas?.addToSelection(copiedElements);
        canvas?.cloneSelectedElements(5, 5);
        // canvas?.pasteElements(canvas?.selectedElements, 0, 0);
        // console.log("pasted!");
      }
    }
    if (event.key === "Backspace" && event.target.tagName !== "INPUT") {
      event.preventDefault();
      event.stopPropagation();
      dispatchCanvasState({ type: "deleteSelectedElements" });
    }
  };

  useLayoutEffect(() => {
    const editorDom = svgcanvasRef.current;
    // Promise.resolve().then(() => {
    const canvas = new SvgCanvas(editorDom, config);
    setSvgCanvas(canvas);
    updateCanvas(canvas, svgcanvasRef.current, config, true);
    // console.log(canvas);
    dispatchCanvasState({ type: "init", canvas, svgcanvas: editorDom, config });
    dispatchCanvasState({ type: "mode", mode: "path" });
    return () => {
      // cleanup function
    };
  }, []);
  updateContextPanel();

  const drawImage = async (ctx: CanvasRenderingContext2D, imageUrl: string) => {
    // return a Promise synchronously
    return new Promise((resolve, reject) => {
      const imgToDraw = new Image();
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 512, 512);
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
        const svgElement = document.getElementById("svgroot");
        // clone the svg element
        const clonedSvgElement = svgElement?.cloneNode(true);
        // remove child id selectorParentGroup
        clonedSvgElement?.removeChild(clonedSvgElement.lastChild!);
        if (clonedSvgElement) {
          var s = new XMLSerializer().serializeToString(clonedSvgElement!);
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
      <div className="OIe-editor relative" role="main">
        <div
          className="workarea"
          style={{
            width: "320px",
            height: "320px",
            position: "relative",
            border: "0.5px solid black",
            outline: "none",
            // background: imageUrlToEdit ? `url(${imageUrlToEdit})` : undefined,
            // background: `linear-gradient(rgba(255,255,255,.5), rgba(255,255,255,.5)), url("fakeImage.png")`,
          }}
          ref={containerRef}
          tabIndex={1}
          onMouseDown={() => {
            containerRef.current?.focus();
          }}
          onKeyDown={e => {
            onKeyDown(e);
            // editorRef.current?.onKeydown(e as any);
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
            onMouseDown={evt => {
              const target = canvas?.getMouseTarget(evt);
              if (target?.tagName === "path") {
                setIsElementSelected(true);
                setSelectedElement(target);
                const fillColor = parseColor(target.getAttribute("fill")!);
                // console.log(target.getAttribute("fill"));
                setFinalSelectedColor(fillColor);
              } else {
                setIsElementSelected(false);
                setSelectedElement(null);
              }
              if (canvas?.drawnPath) {
                setRecentlyUsedColors(prev => {
                  const newSet = new Set(prev);
                  const newArray = Array.from(newSet);
                  if (!newSet.has(finalSelectedColor.toString("hex"))) {
                    if (newSet.size >= 6) {
                      newArray.pop();
                    }
                    newArray.unshift(finalSelectedColor.toString("hex"));
                  }
                  return newArray;
                });
              }
            }}
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
        <Flex justifyContent={"space-between"} UNSAFE_className="mt-1 ">
          <ToggleButton
            width={"size-600"}
            isSelected={realMode !== "path"}
            onPress={() => {
              setRealMode("select");
              dispatchCanvasState({ type: "mode", mode: "select" });
              setIsElementSelected(false);
              // setMode("select");
            }}
          >
            <SelectIcon />
          </ToggleButton>
          <ToggleButton
            isSelected={realMode === "path"}
            width={"size-600"}
            onPress={() => {
              dispatchCanvasState({ type: "mode", mode: "path" });
              setRealMode("path");
              // setMode("path");
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
        <div className="flex gap-1 mb-[-10px] mt-[18px]">
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
          isDisabled={imageUrlToEdit ? true : false}
          size={130}
          UNSAFE_className="my-5 mx-auto"
          defaultValue="hsl(30, 100%, 50%)"
          value={changingColor}
          onChange={color => {
            setChangingColor(color);
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
                    setFinalSelectedColor(newColor);
                  }}
                />
              ))}
            </Flex>
          </Flex>
        ) : (
          <Button
            justifySelf={"end"}
            variant="primary"
            onPress={() => {
              setImageUrlToEdit(undefined);
              // const elements = svgCanvas.getVisibleElements();
              // svgCanvas.addToSelection(elements);
              // svgCanvas.deleteSelectedElements();
              // setRecentlyUsedColors([]);
              // dispatchCanvasState({
              //   type: "color",
              //   colorType: "fill",
              //   color: finalSelectedColor,
              // });
              // dispatchCanvasState({
              //   type: "color",
              //   colorType: "stroke",
              //   color: finalSelectedColor,
              // });
            }}
          >
            Cancel Editing
          </Button>
        )}
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
