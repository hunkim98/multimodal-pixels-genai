import { SketchData, SketchDataElement } from "./Editor";

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
  STROKE_END = "strokeEnd",
}
export type CanvasDataChangeHandler = (params: CanvasDataChangeParams) => void;

export type CanvasDataChangeParams = {
  data: SketchData;
  canvasWidth: number;
  canvasHeight: number;
  canvasLeftTopX: number;
  canvasLeftTopY: number;
};

export type CanvasStrokeEndHandler = (params: CanvasStrokeEndParams) => void;

export type CanvasStrokeEndParams = {
  data: SketchDataElement;
  brushColor: string;
};
