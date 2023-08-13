import { BrushData, BrushDataElement } from "./Editor";

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
  STROKE_END = "strokeEnd",
}
export type CanvasDataChangeHandler = (params: CanvasDataChangeParams) => void;

export type CanvasDataChangeParams = {
  data: BrushData;
  canvasWidth: number;
  canvasHeight: number;
  canvasLeftTopX: number;
  canvasLeftTopY: number;
};

export type CanvasStrokeEndHandler = (params: CanvasStrokeEndParams) => void;

export type CanvasStrokeEndParams = {
  data: BrushDataElement;
  brushColor: string;
};
