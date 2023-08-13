import { Action, ActionType } from "./Action";
import { BrushEraseAction } from "./BrushEraseAction";
import { BrushDataElement } from "./Editor";

export class BrushColorAction extends Action {
  type = ActionType.BrushColor;
  private historyIndex: number;
  private data: BrushDataElement;

  constructor(data: BrushDataElement, historyIndex: number) {
    super();
    this.data = data;
    this.historyIndex = historyIndex;
  }

  createInverseAction(): BrushEraseAction {
    return new BrushEraseAction(this.data, this.historyIndex);
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
