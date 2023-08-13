export enum ActionType {
  BrushColor = "BrushColor",
  BrushErase = "BrushErase",
  CanvasSizeChange = "CanvasSizeChange",
}

export abstract class Action {
  abstract type: ActionType;

  abstract createInverseAction(): Action;

  abstract getType(): string;
}
