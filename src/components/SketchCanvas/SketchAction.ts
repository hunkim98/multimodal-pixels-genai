import { Action, ActionType } from "./Action";
import { SketchEraseAction } from "./SketchEraseAction";
import { SketchDataElement } from "./Editor";

export class SketchAction extends Action {
  type = ActionType.Sketch;
  private historyIndices: Array<number>;
  private data: Array<SketchDataElement>;

  constructor(data: Array<SketchDataElement>, historyIndices: Array<number>) {
    super();
    this.data = data;
    this.historyIndices = historyIndices;
  }

  createInverseAction(): SketchEraseAction {
    return new SketchEraseAction(this.data, this.historyIndices);
  }

  getType(): string {
    return this.type;
  }

  getData() {
    return this.data;
  }

  getHistoryIndices() {
    return this.historyIndices;
  }
}
