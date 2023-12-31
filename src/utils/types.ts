export interface Coord {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type ButtonDimensions = Coord & Dimensions;

export type PanZoom = {
  scale: number;
  offset: Coord;
};

export type PixelData = {
  color: string;
};

export interface ImageDownloadOptions {
  isGridVisible?: boolean;
}

export type DottingData = Map<number, Map<number, PixelData>>;

export interface PixelModifyItem {
  rowIndex: number;
  columnIndex: number;
  color: string;
}

export interface ColorChangeItem extends PixelModifyItem {
  previousColor: string;
}

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
  GRID_CHANGE = "gridChange",
  STROKE_END = "strokeEnd",
  BRUSH_CHANGE = "brushChange",
  HOVER_PIXEL_CHANGE = "hoverPixelChange",
}

export enum SketchTool {
  PEN = "PEN",
  ERASER = "ERASER",
  NONE = "NONE",
}

export type CanvasDataChangeParams = { data: DottingData };

export type CanvasDataChangeHandler = (params: CanvasDataChangeParams) => void;

export type CanvasGridChangeParams = {
  dimensions: {
    columnCount: number;
    rowCount: number;
  };
  indices: {
    topRowIndex: number;
    bottomRowIndex: number;
    leftColumnIndex: number;
    rightColumnIndex: number;
  };
};

export enum MouseMode {
  PANNING = "PANNING",
  EXTENDING = "EXTENDING",
  DRAWING = "DRAWING",
}

export enum ButtonDirection {
  TOP = "TOP",
  BOTTOM = "BOTTOM",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  TOPLEFT = "TOPLEFT",
  TOPRIGHT = "TOPRIGHT",
  BOTTOMLEFT = "BOTTOMLEFT",
  BOTTOMRIGHT = "BOTTOMRIGHT",
}

export type CanvasGridChangeHandler = (params: CanvasGridChangeParams) => void;

export type CanvasStrokeEndParams = {
  strokedPixels: Array<ColorChangeItem>;
  data: DottingData;
  strokeTool: SketchTool;
};

export type CanvasStrokeEndHandler = (params: CanvasStrokeEndParams) => void;

export type CanvasHoverPixelChangeParams = {
  indices: {
    rowIndex: number;
    columnIndex: number;
  } | null;
};

export type CanvasHoverPixelChangeHandler = (
  params: CanvasHoverPixelChangeParams,
) => void;

export type CanvasDataInfo = {
  leftTopX: number;
  leftTopY: number;
  width: number;
  height: number;
};

export type KandinskyBody = {
  prompt: string;
  image?: string;
  mask?: string;
  type: "text2img" | "img2img" | "inpainting";
  num_steps?: number;
  batch_size?: number;
  guidance_scale?: number;
  h?: number;
  w?: number;
  sampler?: string;
  prior_cf_scale?: number;
  prior_steps?: string;
};
