export enum ActionType {
  Sketch = "Sketch",
  Erase = "BrushErase",
  CanvasSizeChange = "CanvasSizeChange",
}

export abstract class Action {
  abstract type: ActionType;

  abstract createInverseAction(): Action;

  abstract getType(): string;
}
