import { CanvasDataInfo } from "@/utils/types";
import { Action, ActionType } from "./Action";

export class CanvasSizeChangeAction extends Action {
  type = ActionType.CanvasSizeChange;
  previousCanvasInfo: CanvasDataInfo;
  newCanvasInfo: CanvasDataInfo;

  constructor(
    previousCanvasInfo: CanvasDataInfo,
    modifiedCanvasInfo: CanvasDataInfo,
  ) {
    super();
    this.previousCanvasInfo = previousCanvasInfo;
    this.newCanvasInfo = modifiedCanvasInfo;
  }

  createInverseAction(): Action {
    return new CanvasSizeChangeAction(
      this.newCanvasInfo,
      this.previousCanvasInfo,
    );
  }

  getType(): string {
    return this.type;
  }

  getNewCanvasInfo(): CanvasDataInfo {
    return this.newCanvasInfo;
  }
}
