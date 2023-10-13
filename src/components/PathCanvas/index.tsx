import React, { useEffect, useState } from "react";
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
import dynamic from "next/dynamic";

const DynamicComponentWithNoSSR = dynamic(() => import("./Editor"), {
  ssr: false,
});

const PathCanvas = () => {
  const fabricRef = React.useRef<fabric.Canvas>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [changingColor, setChangingColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [finalSelectedColor, setFinalSelectedColor] = useState(
    parseColor("hsl(50, 100%, 50%)"),
  );
  const [recentlyUsedColors, setRecentlyUsedColors] = useState<Set<string>>(
    new Set(),
  );
  const [shapeType, setShapeType] = useState<
    "rect" | "ellipse" | "triangle" | undefined
  >(undefined);

  return <DynamicComponentWithNoSSR />;
};

export default PathCanvas;
