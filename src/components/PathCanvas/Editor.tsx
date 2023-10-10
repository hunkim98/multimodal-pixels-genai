import Editor from "@svgedit/svgcanvas";
import React, { useEffect, useLayoutEffect } from "react";
import config from "./config";
import { CanvasContextProvider, canvasContext } from "./canvasContext";
import updateCanvas from "./updateCanvas";

const Canvas = () => {
  const svgcanvasRef = React.useRef<HTMLDivElement>(null);
  const [canvasState, dispatchCanvasState] = React.useContext(canvasContext);
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

  useLayoutEffect(() => {
    const editorDom = svgcanvasRef.current;
    // Promise.resolve().then(() => {
    const canvas = new Editor(editorDom, config);
    updateCanvas(canvas, svgcanvasRef.current, config, true);
    console.log(canvas);
    dispatchCanvasState({ type: "init", canvas, svgcanvas: editorDom, config });
    //   svgEditor.setConfig({
    //     allowInitialUserOverride: false,
    //     extensions: [],
    //     noDefaultExtensions: true,
    //     userExtensions: ["./react-test.js"],
    //   });
    //   svgEditor.init();
    // });
  }, []);
  updateContextPanel();
  return (
    <div className="OIe-editor" role="main">
      <div className="workarea">
        <div
          ref={svgcanvasRef}
          className="svgcanvas"
          style={{ position: "relative" }}
        />
      </div>
    </div>
  );
};

const CanvasWithContext = (props: any) => (
  <CanvasContextProvider>
    <Canvas {...props} />
  </CanvasContextProvider>
);

export default CanvasWithContext;

// export default DynamicPathCanvas;
