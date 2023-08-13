import { BrushData } from "./Canvas";

export enum CanvasEvents {
  DATA_CHANGE = "dataChange",
}
export type CanvasDataChangeHandler = (params: CanvasDataChangeParams) => void;

export type CanvasDataChangeParams = {
  data: BrushData;
  canvasWidth: number;
  canvasHeight: number;
  canvasLeftTopX: number;
  canvasLeftTopY: number;
};
