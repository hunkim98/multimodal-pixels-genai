import EventDispatcher from "@/utils/eventDispatcher";
import {
  PenTool,
  Coord,
  PanZoom,
  ButtonDirection,
  MouseMode,
  ButtonDimensions,
  CanvasDataInfo,
} from "../../utils/types";
import { TouchyEvent, addEvent, removeEvent, touchy } from "@/utils/touch";
import {
  calculateNewPanZoomFromPinchZoom,
  getIsPointInsideRegion,
  getMouseCartCoord,
  getPointFromTouchyEvent,
  returnScrollOffsetFromMouseOffset,
} from "@/utils/position";
import {
  convertCartesianToScreen,
  diffPoints,
  getScreenPoint,
  lerpRanges,
} from "@/utils/math";
import {
  DefaultMaxScale,
  DefaultMinScale,
  InteractionEdgeTouchingRange,
  InteractionExtensionAllowanceRatio,
} from "@/utils/config";
import { Action, ActionType } from "./Action";
import { BrushColorAction } from "./BrushColorAction";
import { getNewGUIDString } from "@/utils/guid";
import { BrushEraseAction } from "./BrushEraseAction";
import { CanvasSizeChangeAction } from "./CanvasSizeChangeAction";
import { BrushTool } from "dotting";

export type BrushDataElement = {
  id: string;
  color: string;
  points: Array<Coord>;
  strokeWidth: number;
};

export type BrushData = Array<BrushDataElement>;

export class Canvas extends EventDispatcher {
  private width: number = 0;
  private height: number = 0;
  private panZoom: PanZoom = {
    scale: 1,
    offset: { x: 0, y: 0 },
  };
  private maxScale: number = 1.5;
  private minScale: number = 0.3;
  private panPoint: { lastMousePos: Coord } = {
    lastMousePos: { x: 0, y: 0 },
  };
  private pinchZoomDiff: number | null = null;
  private brushTool: PenTool = PenTool.PEN;
  private mouseMode: MouseMode = MouseMode.DRAWING;
  private dpr = 1;
  private strokeWidth = 3;
  private zoomSensitivity = 200;
  private brushColor = "#FF0000";
  private mouseDownWorldPos: Coord | null = null;
  private mouseDownPanZoom: PanZoom | null = null;
  private mouseMoveWorldPos: Coord = { x: 0, y: 0 };
  private previousMouseMoveWorldPos: Coord | null = null;
  private directionToExtendSelectedArea: ButtonDirection | null = null;
  private undoHistory: Array<Action> = [];
  private redoHistory: Array<Action> = [];
  private canvasInfo: CanvasDataInfo = {
    lefTopX: 0,
    lefTopY: 0,
    width: 0,
    height: 0,
  };
  private capturedCanvasInfo: CanvasDataInfo = {
    lefTopX: 0,
    lefTopY: 0,
    width: 0,
    height: 0,
  };
  private currentBrushPoints: Array<Coord> | null = null;
  private data: BrushData = [];
  private extensionPoint: {
    direction: ButtonDirection | null;
    offsetYAmount: number;
    offsetXAmount: number;
  } = {
    direction: null,
    offsetYAmount: 0,
    offsetXAmount: 0,
  };
  private ctx: CanvasRenderingContext2D;
  private element: HTMLCanvasElement;
  private backgroundElement: HTMLCanvasElement;

  constructor(
    element: HTMLCanvasElement,
    backgroundElement: HTMLCanvasElement,
    canvasWidth?: number,
    canvasHeight?: number,
    canvasLeftTopX?: number,
    canvasLeftTopY?: number,
    initData?: BrushData,
  ) {
    super();
    this.element = element;
    this.backgroundElement = backgroundElement;

    this.ctx = this.element.getContext("2d") as CanvasRenderingContext2D;
    this.data = initData || [];
    this.canvasInfo = {
      lefTopX: canvasLeftTopX || 0,
      lefTopY: canvasLeftTopY || 0,
      width: canvasWidth || 150,
      height: canvasHeight || 150,
    };
    this.setPanZoom({
      offset: {
        x:
          (this.panZoom.scale *
            (-this.canvasInfo.width + this.canvasInfo.lefTopX)) /
          2,
        y:
          (this.panZoom.scale *
            (-this.canvasInfo.height + this.canvasInfo.lefTopY)) /
          2,
      },
    });
    this.render();
    this.initialize();
  }

  initialize() {
    this.emit = this.emit.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);

    // add event listeners
    touchy(this.element, addEvent, "mousedown", this.onMouseDown);
    touchy(this.element, addEvent, "mouseup", this.onMouseUp);
    touchy(this.element, addEvent, "mouseout", this.onMouseOut);
    touchy(this.element, addEvent, "mousemove", this.onMouseMove);
    this.element.addEventListener("wheel", this.handleWheel);
  }

  scale(x: number, y: number) {
    this.ctx.scale(x, y);
  }

  setSize(width: number, height: number, devicePixelRatio?: number) {
    this.setWidth(width, devicePixelRatio);
    this.setHeight(height, devicePixelRatio);
    this.setDpr(devicePixelRatio ? devicePixelRatio : this.dpr);
  }

  setWidth(width: number, devicePixelRatio?: number) {
    this.width = width;
    this.element.width = devicePixelRatio ? width * devicePixelRatio : width;
    this.element.style.width = `${width}px`;
    this.backgroundElement.width = devicePixelRatio
      ? width * devicePixelRatio
      : width;
    this.backgroundElement.style.width = `${width}px`;
  }

  setHeight(height: number, devicePixelRatio?: number) {
    this.height = height;
    this.element.height = devicePixelRatio ? height * devicePixelRatio : height;
    this.element.style.height = `${height}px`;
    this.backgroundElement.height = devicePixelRatio
      ? height * devicePixelRatio
      : height;
    this.backgroundElement.style.height = `${height}px`;
  }

  setDpr(dpr: number) {
    this.dpr = dpr;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  detectSelectedAreaExtendDirection(coord: Coord): ButtonDirection | null {
    const extensionAllowanceRatio = InteractionExtensionAllowanceRatio;
    const strokeTouchingRange = InteractionEdgeTouchingRange;
    const scaledYHeight = lerpRanges(
      this.panZoom.scale,
      // this range is inverted because height has to be smaller when zoomed in
      DefaultMaxScale,
      DefaultMinScale,
      strokeTouchingRange,
      strokeTouchingRange * extensionAllowanceRatio,
    );
    const scaledXWidth = lerpRanges(
      this.panZoom.scale,
      DefaultMaxScale,
      DefaultMinScale,
      strokeTouchingRange,
      strokeTouchingRange * extensionAllowanceRatio,
    );
    const x = coord.x;
    const y = coord.y;
    // const { areaTopLeftPos, areaBottomRightPos } = getAreaTopLeftAndBottomRight(
    // this.selectedArea,
    // );
    const top = {
      x: this.canvasInfo.lefTopX,
      y: this.canvasInfo.lefTopY,
      width: this.canvasInfo.width,
      height: this.canvasInfo.height,
    };
    const bottom = {
      x: this.canvasInfo.lefTopX,
      y: this.canvasInfo.lefTopY + this.canvasInfo.height,
      width: this.canvasInfo.width,
      height: scaledYHeight,
    };
    const left = {
      x: this.canvasInfo.lefTopX,
      y: this.canvasInfo.lefTopY,
      width: scaledXWidth,
      height: this.canvasInfo.height,
    };
    const right = {
      x: this.canvasInfo.lefTopX + this.canvasInfo.width,
      y: this.canvasInfo.lefTopY,
      width: scaledXWidth,
      height: this.canvasInfo.height,
    };
    const cornerSquareHalfLength = left.width;
    if (
      x >= top.x + cornerSquareHalfLength &&
      x <= top.x + top.width - cornerSquareHalfLength &&
      y >= top.y - cornerSquareHalfLength &&
      y <= top.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOP;
    } else if (
      x >= bottom.x + cornerSquareHalfLength &&
      x <= bottom.x + bottom.width - cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOM;
    } else if (
      x >= left.x - cornerSquareHalfLength &&
      x <= left.x + cornerSquareHalfLength &&
      y >= left.y + cornerSquareHalfLength &&
      y <= left.y + left.height - cornerSquareHalfLength
    ) {
      return ButtonDirection.LEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= right.y + cornerSquareHalfLength &&
      y <= right.y + right.height - cornerSquareHalfLength
    ) {
      return ButtonDirection.RIGHT;
    } else if (
      x >= top.x - cornerSquareHalfLength &&
      x <= top.x + cornerSquareHalfLength &&
      y >= top.y - cornerSquareHalfLength &&
      y <= top.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOPLEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= right.y - cornerSquareHalfLength &&
      y <= right.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.TOPRIGHT;
    } else if (
      x >= bottom.x - cornerSquareHalfLength &&
      x <= bottom.x + cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOMLEFT;
    } else if (
      x >= right.x - cornerSquareHalfLength &&
      x <= right.x + cornerSquareHalfLength &&
      y >= bottom.y - cornerSquareHalfLength &&
      y <= bottom.y + cornerSquareHalfLength
    ) {
      return ButtonDirection.BOTTOMRIGHT;
    } else {
      return null;
    }
  }

  setCanvasWidth(width: number) {
    this.canvasInfo.width = width;
  }

  setCanvasHeight(height: number) {
    this.canvasInfo.height = height;
  }

  //   extendCanvas(direction: ButtonDirection, extendCoord: Coord) {
  //     if(dir)
  //   }

  extendCanvasSideWays(direction: ButtonDirection, extendCoord: Coord) {
    if (!this.mouseDownWorldPos) return;
    if (!this.capturedCanvasInfo) return;
    const heightExtensionOffset =
      direction === ButtonDirection.TOP
        ? this.mouseDownWorldPos!.y - extendCoord.y
        : extendCoord.y - this.mouseDownWorldPos!.y;
    const widthExtensionOffset =
      direction === ButtonDirection.LEFT
        ? this.mouseDownWorldPos!.x - extendCoord.x
        : extendCoord.x - this.mouseDownWorldPos!.x;
    const newWidth = this.capturedCanvasInfo.width + widthExtensionOffset;
    const newHeight = this.capturedCanvasInfo.height + heightExtensionOffset;
    if (direction === ButtonDirection.TOP) {
      this.canvasInfo.lefTopY =
        this.capturedCanvasInfo.lefTopY - heightExtensionOffset;
      this.setCanvasHeight(newHeight);
    } else if (direction === ButtonDirection.BOTTOM) {
      this.setCanvasHeight(newHeight);
    } else if (direction === ButtonDirection.LEFT) {
      this.canvasInfo.lefTopX =
        this.capturedCanvasInfo.lefTopX - widthExtensionOffset;
      this.setCanvasWidth(newWidth);
    } else if (direction === ButtonDirection.RIGHT) {
      this.setCanvasWidth(newWidth);
    }
  }

  extendCanvasDiagonally(direction: ButtonDirection, extendCoord: Coord) {
    if (!this.mouseDownWorldPos) return;
    if (!this.capturedCanvasInfo) return;
    const heightExtensionOffset =
      direction === ButtonDirection.TOPLEFT ||
      direction === ButtonDirection.TOPRIGHT
        ? this.mouseDownWorldPos!.y - extendCoord.y
        : extendCoord.y - this.mouseDownWorldPos!.y;
    const widthExtensionOffset =
      direction === ButtonDirection.TOPLEFT ||
      direction === ButtonDirection.BOTTOMLEFT
        ? this.mouseDownWorldPos!.x - extendCoord.x
        : extendCoord.x - this.mouseDownWorldPos!.x;
    const newWidth = this.capturedCanvasInfo.width + widthExtensionOffset;
    const newHeight = this.capturedCanvasInfo.height + heightExtensionOffset;
    if (direction === ButtonDirection.TOPLEFT) {
      this.canvasInfo.lefTopY =
        this.capturedCanvasInfo.lefTopY - heightExtensionOffset;
      this.canvasInfo.lefTopX =
        this.capturedCanvasInfo.lefTopX - widthExtensionOffset;
      this.setCanvasHeight(newHeight);
      this.setCanvasWidth(newWidth);
    } else if (direction === ButtonDirection.TOPRIGHT) {
      this.canvasInfo.lefTopY =
        this.capturedCanvasInfo.lefTopY - heightExtensionOffset;
      this.setCanvasHeight(newHeight);
      this.setCanvasWidth(newWidth);
    } else if (direction === ButtonDirection.BOTTOMLEFT) {
      this.canvasInfo.lefTopX =
        this.capturedCanvasInfo.lefTopX - widthExtensionOffset;
      this.setCanvasHeight(newHeight);
      this.setCanvasWidth(newWidth);
    } else if (direction === ButtonDirection.BOTTOMRIGHT) {
      this.setCanvasHeight(newHeight);
      this.setCanvasWidth(newWidth);
    }
  }

  undo() {
    if (this.undoHistory.length === 0) return;
    const action = this.undoHistory.pop();
    const inverseAction = action?.createInverseAction();
    console.log(inverseAction, "inverse action");
    this.commitAction(inverseAction!);
    this.redoHistory.push(action!);
  }

  redo() {
    if (this.redoHistory.length === 0) return;
    const action = this.redoHistory.pop();
    this.commitAction(action!);
    this.undoHistory.push(action!);
  }

  commitAction(action: Action) {
    const type = action.getType();
    console.log("committing action", type);
    switch (type) {
      case ActionType.BrushColor:
        const brushColorAction = action as BrushColorAction;
        this.data.push(brushColorAction.getData());
        break;
      case ActionType.BrushErase:
        const brushEraseAction = action as BrushEraseAction;
        this.data.splice(brushEraseAction.getHistoryIndex(), 1);
        console.log("erasing", brushEraseAction.getHistoryIndex());
        break;
      case ActionType.CanvasSizeChange:
        const canvasSizeChangeAction = action as CanvasSizeChangeAction;
        this.canvasInfo = canvasSizeChangeAction.getNewCanvasInfo();
        break;
    }
    this.render();
  }

  handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyZ" && (e.ctrlKey || e.metaKey)) {
      this.undo();
    }
    if (e.code === "KeyY" && (e.ctrlKey || e.metaKey)) {
      this.redo();
    }
  };

  handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (this.mouseMode === MouseMode.EXTENDING) {
      return;
    }
    if (e.ctrlKey) {
      const zoom = 1 - e.deltaY / this.zoomSensitivity;
      let newScale = this.panZoom.scale * zoom;

      if (newScale > this.maxScale) {
        newScale = this.maxScale;
      }
      if (newScale < this.minScale) {
        newScale = this.minScale;
      }
      const mouseOffset = { x: e.offsetX, y: e.offsetY };
      const newOffset = returnScrollOffsetFromMouseOffset(
        mouseOffset,
        this.panZoom,
        newScale,
      );

      this.setPanZoom({ scale: newScale, offset: newOffset });
    } else {
      const offset = diffPoints(this.panZoom.offset, {
        x: e.deltaX,
        y: e.deltaY,
      });
      this.setPanZoom({ ...this.panZoom, offset });
    }
  };

  handlePanning = (evt: TouchyEvent) => {
    const lastMousePos = this.panPoint.lastMousePos;
    if (window.TouchEvent && evt instanceof TouchEvent) {
      if (evt.touches.length > 1) {
        return;
      }
    }
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    const currentMousePos: Coord = { x: point.offsetX, y: point.offsetY };
    this.panPoint.lastMousePos = currentMousePos;
    const mouseDiff = diffPoints(lastMousePos, currentMousePos);
    const offset = diffPoints(this.panZoom.offset, mouseDiff);
    this.setPanZoom({ offset });
    return;
  };

  handlePinchZoom(evt: TouchyEvent) {
    const newPanZoom = calculateNewPanZoomFromPinchZoom(
      evt,
      this.element,
      this.panZoom,
      this.zoomSensitivity,
      this.pinchZoomDiff,
      this.minScale,
      this.maxScale,
    );
    if (newPanZoom) {
      this.pinchZoomDiff = newPanZoom.pinchZoomDiff;
      this.setPanZoom(newPanZoom.panZoom);
    }
  }

  handleExtension = (evt: TouchyEvent) => {
    evt.preventDefault();
    const mouseDownPanZoom = this.mouseDownPanZoom!;
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      mouseDownPanZoom,
      this.dpr,
    );
    const buttonDirection = this.extensionPoint.direction;
    const mouseOffsetDegree = diffPoints(
      this.mouseDownWorldPos!,
      mouseCartCoord,
    );
    const mouseOffsetChangeYAmount = mouseOffsetDegree.y;
    const mouseOffsetChangeXAmount = mouseOffsetDegree.x;

    if (buttonDirection) {
      switch (buttonDirection) {
        case ButtonDirection.TOP:
          this.extendCanvasSideWays(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.BOTTOM:
          this.extendCanvasSideWays(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.LEFT:
          this.extendCanvasSideWays(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.RIGHT:
          this.extendCanvasSideWays(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.TOPLEFT:
          this.extendCanvasDiagonally(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.TOPRIGHT:
          this.extendCanvasDiagonally(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.BOTTOMLEFT:
          this.extendCanvasDiagonally(buttonDirection, mouseCartCoord);
          break;
        case ButtonDirection.BOTTOMRIGHT:
          this.extendCanvasDiagonally(buttonDirection, mouseCartCoord);
          break;

        default:
          break;
      }
    }
    this.extensionPoint.offsetYAmount = mouseOffsetChangeYAmount;
    this.extensionPoint.offsetXAmount = mouseOffsetChangeXAmount;
    this.render();
  };

  onMouseDown(evt: TouchyEvent) {
    evt.preventDefault();
    const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
    this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      this.panZoom,
      this.dpr,
    );
    this.mouseDownWorldPos = {
      x: mouseCartCoord.x,
      y: mouseCartCoord.y,
    };
    this.mouseDownPanZoom = {
      offset: {
        x: this.panZoom.offset.x,
        y: this.panZoom.offset.y,
      },
      scale: this.panZoom.scale,
    };
    const buttonDirection = this.detectSelectedAreaExtendDirection(
      this.mouseDownWorldPos,
    );
    if (buttonDirection) {
      this.mouseMode = MouseMode.EXTENDING;
      this.directionToExtendSelectedArea = buttonDirection;
      this.extensionPoint = {
        direction: buttonDirection,
        offsetYAmount: 0,
        offsetXAmount: 0,
      };
      this.capturedCanvasInfo = {
        lefTopX: this.canvasInfo.lefTopX,
        lefTopY: this.canvasInfo.lefTopY,
        width: this.canvasInfo.width,
        height: this.canvasInfo.height,
      };
      touchy(this.element, addEvent, "mousemove", this.handleExtension);
      return;
    }

    const isPointInsideCanvas = getIsPointInsideRegion(mouseCartCoord, {
      startWorldPos: {
        x: this.canvasInfo.lefTopX,
        y: this.canvasInfo.lefTopY,
      },
      endWorldPos: {
        x: this.canvasInfo.lefTopX + this.canvasInfo.width,
        y: this.canvasInfo.lefTopY + this.canvasInfo.height,
      },
    });
    if (isPointInsideCanvas) {
      this.mouseMode = MouseMode.DRAWING;
    } else {
      this.mouseMode = MouseMode.PANNING;
    }

    if (isPointInsideCanvas) {
      const strokeDataPoint: Array<Coord> = [];
      this.data.push({
        id: getNewGUIDString(),
        color: this.brushTool === PenTool.PEN ? this.brushColor : "#fff",
        strokeWidth: this.strokeWidth,
        points: strokeDataPoint,
      });
      this.currentBrushPoints = strokeDataPoint;
      if (this.brushTool === PenTool.PEN) {
        this.mouseMode = MouseMode.DRAWING;
        this.currentBrushPoints.push({
          x: mouseCartCoord.x,
          y: mouseCartCoord.y,
        });
      } else if (this.brushTool === PenTool.ERASER) {
        this.currentBrushPoints.push({
          x: mouseCartCoord.x,
          y: mouseCartCoord.y,
        });
      }
    }
    if (this.mouseMode === MouseMode.PANNING) {
      touchy(this.element, addEvent, "mousemove", this.handlePanning);
      touchy(this.element, addEvent, "mousemove", this.handlePinchZoom);
    }
    this.render();
  }

  onMouseMove(evt: TouchyEvent) {
    evt.preventDefault();
    const mouseCartCoord = getMouseCartCoord(
      evt,
      this.element,
      this.panZoom,
      this.dpr,
    );
    this.mouseMoveWorldPos = {
      x: mouseCartCoord.x,
      y: mouseCartCoord.y,
    };
    if (!this.currentBrushPoints) {
      return;
    }
    if (this.brushTool === PenTool.PEN) {
      this.currentBrushPoints.push({
        x: mouseCartCoord.x,
        y: mouseCartCoord.y,
      });
    } else if (this.brushTool === PenTool.ERASER) {
      this.currentBrushPoints.push({
        x: mouseCartCoord.x,
        y: mouseCartCoord.y,
      });
    }
    this.render();
  }

  changeBrushColor(color: string) {
    this.brushColor = color;
  }

  changeBrushTool(tool: PenTool) {
    this.brushTool = tool;
  }

  changeStrokeWidth(width: number) {
    this.strokeWidth = width;
  }

  recordAction(action: Action) {
    this.undoHistory.push(action);
    console.log("undoHistory", action);
    this.redoHistory = [];
  }

  onMouseUp(evt: TouchyEvent) {
    evt.preventDefault();
    if (this.mouseMode === MouseMode.DRAWING) {
      console.log("mosue mode was drawing");
      const recentDrawnStroke = this.data[this.data.length - 1];
      if (recentDrawnStroke.points.length === 0) {
        return;
      }
      if (this.brushTool === PenTool.PEN) {
        this.recordAction(
          new BrushColorAction(recentDrawnStroke, this.data.length - 1),
        );
      } else {
        this.recordAction(
          new BrushColorAction(recentDrawnStroke, this.data.length - 1),
        );
      }
    } else if (this.mouseMode === MouseMode.EXTENDING) {
      this.recordAction(
        new CanvasSizeChangeAction(this.capturedCanvasInfo, this.canvasInfo),
      );
    }
    this.mouseMode === MouseMode.PANNING;
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
    this.currentBrushPoints = null;
    this.pinchZoomDiff = null;
    this.mouseDownWorldPos = null;
    this.mouseDownPanZoom = null;
    this.extensionPoint.offsetXAmount = 0;
    this.extensionPoint.offsetYAmount = 0;
    this.previousMouseMoveWorldPos = null;
    return;
  }

  onMouseOut(evt: TouchyEvent) {
    evt.preventDefault();
    this.currentBrushPoints = null;
    if (this.mouseMode === MouseMode.DRAWING) {
      const recentDrawnStroke = this.data[this.data.length - 1];
      if (this.brushTool === PenTool.PEN) {
        if (recentDrawnStroke.points.length === 0) {
          this.recordAction(
            new BrushColorAction(recentDrawnStroke, this.data.length - 1),
          );
        }
      } else {
        this.recordAction(
          new BrushColorAction(recentDrawnStroke, this.data.length - 1),
        );
      }
    } else if (this.mouseMode === MouseMode.EXTENDING) {
      this.recordAction(
        new CanvasSizeChangeAction(this.capturedCanvasInfo, this.canvasInfo),
      );
    }
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    touchy(this.element, removeEvent, "mousemove", this.handleExtension);
  }

  setPanZoom({
    offset,
    scale,
  }: Partial<PanZoom> & { baseColumnCount?: number; baseRowCount?: number }) {
    if (scale) {
      this.panZoom.scale = scale;
    }
    if (offset) {
      const correctedOffset = { ...offset };

      // rowCount * this.gridSquareLength * this.panZoom.scale < this.height
      // Offset changes when grid is bigger than canvas
      const isCanvasWidthBiggerThanElement =
        this.canvasInfo.width * this.panZoom.scale > this.height;
      const isCanvasHeightBiggerThanElement =
        this.canvasInfo.height * this.panZoom.scale > this.width;

      const minXPosition = isCanvasHeightBiggerThanElement
        ? -(this.canvasInfo.width * this.panZoom.scale) -
          (this.width / 2) * this.panZoom.scale
        : (-this.width / 2) * this.panZoom.scale;

      const minYPosition = isCanvasWidthBiggerThanElement
        ? -this.canvasInfo.height * this.panZoom.scale -
          (this.height / 2) * this.panZoom.scale
        : (-this.height / 2) * this.panZoom.scale;

      const maxXPosition = isCanvasHeightBiggerThanElement
        ? this.width - (this.width / 2) * this.panZoom.scale
        : this.width -
          this.canvasInfo.width * this.panZoom.scale -
          (this.width / 2) * this.panZoom.scale;
      const maxYPosition = isCanvasWidthBiggerThanElement
        ? this.height - (this.height / 2) * this.panZoom.scale
        : this.height -
          this.canvasInfo.height * this.panZoom.scale -
          (this.height / 2) * this.panZoom.scale;
      if (correctedOffset.x < minXPosition) {
        correctedOffset.x = minXPosition;
      }
      if (correctedOffset.y < minYPosition) {
        correctedOffset.y = minYPosition;
      }
      if (correctedOffset.x > maxXPosition) {
        correctedOffset.x = maxXPosition;
      }
      if (correctedOffset.y > maxYPosition) {
        correctedOffset.y = maxYPosition;
      }
      this.panZoom.offset = correctedOffset;
    }

    // we must render all when panzoom changes!
    this.render();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  destroy() {
    touchy(this.element, removeEvent, "mouseup", this.onMouseUp);
    touchy(this.element, removeEvent, "mouseout", this.onMouseOut);
    touchy(this.element, removeEvent, "mousedown", this.onMouseDown);
    touchy(this.element, removeEvent, "mousemove", this.onMouseMove);
    touchy(this.element, removeEvent, "mousemove", this.handlePanning);
    touchy(this.element, removeEvent, "mousemove", this.handlePinchZoom);
    this.element.removeEventListener("wheel", this.handleWheel);
  }

  render() {
    this.clear();

    this.ctx.save();
    this.ctx.fillStyle = "#999999";
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();

    const convertedLeftTopScreenPoint = convertCartesianToScreen(
      this.element,
      { x: this.canvasInfo.lefTopX, y: this.canvasInfo.lefTopY },
      this.dpr,
    );
    const correctedLeftTopScreenPoint = getScreenPoint(
      convertedLeftTopScreenPoint,
      this.panZoom,
    );
    // clipping
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(
      correctedLeftTopScreenPoint.x,
      correctedLeftTopScreenPoint.y,
    );
    this.ctx.lineTo(
      this.canvasInfo.width * this.panZoom.scale +
        correctedLeftTopScreenPoint.x,
      correctedLeftTopScreenPoint.y,
    );
    this.ctx.lineTo(
      this.canvasInfo.width * this.panZoom.scale +
        correctedLeftTopScreenPoint.x,
      this.canvasInfo.height * this.panZoom.scale +
        correctedLeftTopScreenPoint.y,
    );
    this.ctx.lineTo(
      correctedLeftTopScreenPoint.x,
      this.canvasInfo.height * this.panZoom.scale +
        correctedLeftTopScreenPoint.y,
    );
    this.ctx.lineTo(
      correctedLeftTopScreenPoint.x,
      correctedLeftTopScreenPoint.y,
    );
    this.ctx.clip();

    // background
    this.ctx.save();
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(
      correctedLeftTopScreenPoint.x,
      correctedLeftTopScreenPoint.y,
      this.canvasInfo.width * this.panZoom.scale,
      this.canvasInfo.height * this.panZoom.scale,
    );
    this.ctx.restore();

    // brush
    this.ctx.save();
    for (let i = 0; i < this.data.length; i++) {
      const brushStroke = this.data[i];
      this.ctx.beginPath();
      this.ctx.strokeStyle = brushStroke.color;
      this.ctx.lineWidth = brushStroke.strokeWidth * this.panZoom.scale;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      for (let j = 0; j < brushStroke.points.length; j++) {
        const point = brushStroke.points[j];
        const convertedScreenPoint = convertCartesianToScreen(
          this.element,
          point,
          this.dpr,
        );
        const correctedScreenPoint = getScreenPoint(
          convertedScreenPoint,
          this.panZoom,
        );
        if (j === 0) {
          this.ctx.moveTo(correctedScreenPoint.x, correctedScreenPoint.y);
        } else {
          this.ctx.lineTo(correctedScreenPoint.x, correctedScreenPoint.y);
        }
      }
      this.ctx.stroke();
    }
    this.ctx.restore();

    // end of clipping
    this.ctx.restore();
  }
}

export default Canvas;
