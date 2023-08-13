import { Action, ActionType } from "./Action";
import { BrushColorAction } from "./BrushColorAction";
import { BrushDataElement } from "./Editor";

export class BrushEraseAction extends Action {
  type = ActionType.BrushErase;
  private historyIndex: number;
  private data: BrushDataElement;

  constructor(data: BrushDataElement, historyIndex: number) {
    super();
    this.data = data;
    this.historyIndex = historyIndex;
  }

  createInverseAction(): BrushColorAction {
    return new BrushColorAction(this.data, this.historyIndex);
  }

  getType(): string {
    return this.type;
  }

  getData(): BrushDataElement {
    return this.data;
  }

  getHistoryIndex(): number {
    return this.historyIndex;
  }
}
