import EventDispatcher from "@/utils/eventDispatcher";
import { PenTool, Coord, PanZoom, ButtonDirection } from "../../utils/types";
import { TouchyEvent } from "@/utils/touch";
import { getMouseCartCoord, getPointFromTouchyEvent } from "@/utils/position";

export class Canvas extends EventDispatcher {
    private width: number;
    private height: number;
    private canvasWidth: number;
    private canvasHeight: number;
    private panZoom: PanZoom = {
        scale: 1,
        offset: { x: 0, y: 0 },
    };
    private panPoint: { lastMousePos: Coord } = {
        lastMousePos: { x: 0, y: 0 },
    };
    private brushTool: PenTool = PenTool.PEN;
    private dpr = 1;
    private strokeWidth = 3;
    private brushColor = "#FF0000";
    private mouseDownWorldPos: Coord | null = null;
    private mouseDownPanZoom: PanZoom | null = null;
    private mouseMoveWorldPos: Coord = { x: 0, y: 0 };
    private previousMouseMoveWorldPos: Coord | null = null;
    private brushPoints: Array<{ x: number; y: number; color: string; strokeWidth: number }> = [];
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

    constructor(element: HTMLCanvasElement, width: number, height: number, canvasWidth: number, canvasHeight: number) {
        super();
        this.width = width;
        this.height = height;
        this.element = element;
        this.element.width = width;
        this.element.height = height;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.ctx = this.element.getContext("2d") as CanvasRenderingContext2D;
    }

    setSize(width: number, height: number, devicePixelRatio?: number) {
        this.setWidth(width, devicePixelRatio);
        this.setHeight(height, devicePixelRatio);
        this.setDpr(devicePixelRatio ? devicePixelRatio : this.dpr);
    }

    setWidth(width: number, devicePixelRatio?: number) {
        this.width = width;
    }

    setHeight(height: number, devicePixelRatio?: number) {
        this.height = height;
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

    onMouseDown(evt: TouchyEvent) {
        evt.preventDefault();
        const point = getPointFromTouchyEvent(evt, this.element, this.panZoom);
        this.panPoint.lastMousePos = { x: point.offsetX, y: point.offsetY };
        const mouseCartCoord = getMouseCartCoord(
            evt,
            this.element,
            this.panZoom,
            this.dpr
        )
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

        if (this.brushTool === PenTool.PEN) {
            this.brushPoints.push({
                x: mouseCartCoord.x,
                y: mouseCartCoord.y,
                color: this.brushColor,
                strokeWidth: this.strokeWidth,
            });
        } else if (this.brushTool === PenTool.ERASER) {
            this.brushPoints.push({
                x: mouseCartCoord.x,
                y: mouseCartCoord.y,
                color: "#FFFFFF",
                strokeWidth: this.strokeWidth,
            });
        }
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
                this.canvasWidth * this.panZoom.scale > this.height;
            const isCanvasHeightBiggerThanElement =
                this.canvasHeight * this.panZoom.scale > this.width;

            const minXPosition = isCanvasHeightBiggerThanElement
                ? -(this.canvasWidth * this.panZoom.scale) -
                (this.width / 2) * this.panZoom.scale
                : (-this.width / 2) * this.panZoom.scale;

            const minYPosition = isCanvasWidthBiggerThanElement
                ? -this.canvasHeight * this.panZoom.scale -
                (this.height / 2) * this.panZoom.scale
                : (-this.height / 2) * this.panZoom.scale;

            const maxXPosition = isCanvasHeightBiggerThanElement
                ? this.width - (this.width / 2) * this.panZoom.scale
                : this.width -
                this.canvasWidth * this.panZoom.scale -
                (this.width / 2) * this.panZoom.scale;
            const maxYPosition = isCanvasWidthBiggerThanElement
                ? this.height - (this.height / 2) * this.panZoom.scale
                : this.height -
                this.canvasHeight * this.panZoom.scale -
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


    render() {
        this.clear();
    }

}