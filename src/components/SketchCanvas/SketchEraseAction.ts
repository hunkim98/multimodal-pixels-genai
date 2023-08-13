import { Action, ActionType } from "./Action";
import { SketchAction } from "./SketchAction";
import { SketchDataElement } from "./Editor";

export class SketchEraseAction extends Action {
  type = ActionType.Erase;
  private historyIndices: Array<number>;
  private data: Array<SketchDataElement>;

  constructor(data: Array<SketchDataElement>, historyIndices: Array<number>) {
    super();
    this.data = data;
    this.historyIndices = historyIndices;
  }

  createInverseAction(): SketchAction {
    return new SketchAction(
      this.data.map(el => {
        return {
          ...el,
          isVisible: true,
        };
      }),
      this.historyIndices,
    );
  }

  getType(): string {
    return this.type;
  }

  getData() {
    return this.data;
  }

  getHistoryIndex() {
    return this.historyIndices;
  }
}
