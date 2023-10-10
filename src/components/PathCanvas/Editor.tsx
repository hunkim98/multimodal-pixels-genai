import Editor from "@svgedit/svgcanvas";
import React, { useEffect } from "react";
import config from "./config";

const DynamicPathCanvas = () => {
  const svgEditorContainer = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      const svgEditor = new Editor(svgEditorContainer.current, config);
      //   svgEditor.setConfig({
      //     allowInitialUserOverride: false,
      //     extensions: [],
      //     noDefaultExtensions: true,
      //     userExtensions: ["./react-test.js"],
      //   });
      //   svgEditor.init();
    });
  }, []);
  return (
    <div className="OIe-editor" role="main">
      <div className="workarea">
        <div
          ref={svgEditorContainer}
          className="svgcanvas"
          style={{ position: "relative" }}
        />
      </div>
    </div>
  );
};

export default DynamicPathCanvas;
