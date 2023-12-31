import { addPoints, diffPoints, getScreenPoint, getWorldPoint } from "./math";
import { TouchyEvent } from "./touch";
import { Coord, PanZoom } from "./types";

export const getPointFromTouchyEvent = (
    evt: TouchyEvent,
    element: HTMLCanvasElement,
    panZoom: PanZoom,
) => {
    let originY;
    let originX;
    let offsetX;
    let offsetY;
    if (window.TouchEvent && evt instanceof TouchEvent) {
        //this is for tablet or mobile
        let isCanvasTouchIncluded = false;
        let firstCanvasTouchIndex = 0;
        for (let i = 0; i < evt.touches.length; i++) {
            const target = evt.touches.item(i)!.target;
            if (target instanceof HTMLCanvasElement) {
                isCanvasTouchIncluded = true;
                firstCanvasTouchIndex = i;
                break;
            }
        }
        if (isCanvasTouchIncluded) {
            return getPointFromTouch(
                evt.touches[firstCanvasTouchIndex],
                element,
                panZoom,
            );
        } else {
            return getPointFromTouch(evt.touches[0], element, panZoom);
        }
    } else {
        //this is for PC
        originY = evt.clientY;
        originX = evt.clientX;
        offsetX = evt.offsetX;
        offsetY = evt.offsetY;
    }
    originY += window.scrollY;
    originX += window.scrollX;
    return {
        y: originY - panZoom.offset.y,
        x: originX - panZoom.offset.x,
        offsetX: offsetX,
        offsetY: offsetY,
    };
};

export const getPointFromTouch = (
    touch: Touch,
    element: HTMLCanvasElement,
    panZoom: PanZoom,
) => {
    const r = element.getBoundingClientRect();
    const originY = touch.clientY;
    const originX = touch.clientX;
    const offsetX = touch.clientX - r.left;
    const offsetY = touch.clientY - r.top;
    return {
        x: originX - panZoom.offset.x,
        y: originY - panZoom.offset.y,
        offsetX: offsetX,
        offsetY: offsetY,
    };
};

export const calculateNewPanZoomFromPinchZoom = (
    evt: TouchyEvent,
    element: HTMLCanvasElement,
    panZoom: PanZoom,
    zoomSensitivity: number,
    prevPinchZoomDiff: number | null,
    minScale: number,
    maxScale: number,
): { pinchZoomDiff: number; panZoom: PanZoom } | null => {
    evt.preventDefault();
    if (window.TouchEvent && evt instanceof TouchEvent) {
        const touchCount = evt.touches.length;
        if (touchCount < 2) {
            return null;
        }
        const canvasTouchEventIndexes = [];
        for (let i = 0; i < touchCount; i++) {
            const target = evt.touches.item(i)!.target;
            if (target instanceof HTMLCanvasElement) {
                canvasTouchEventIndexes.push(i);
            }
        }
        if (canvasTouchEventIndexes.length !== 2) {
            return null;
        }
        const firstTouch = evt.touches[canvasTouchEventIndexes[0]];
        const secondTouch = evt.touches[canvasTouchEventIndexes[1]];
        const pinchZoomCurrentDiff =
            Math.abs(firstTouch.clientX - secondTouch.clientX) +
            Math.abs(firstTouch.clientY - secondTouch.clientY);
        const firstTouchPoint = getPointFromTouch(firstTouch, element, panZoom);
        const secondTouchPoint = getPointFromTouch(secondTouch, element, panZoom);
        const touchCenterPos = {
            x: (firstTouchPoint.offsetX + secondTouchPoint.offsetX) / 2,
            y: (firstTouchPoint.offsetY + secondTouchPoint.offsetY) / 2,
        };

        if (!prevPinchZoomDiff) {
            return { pinchZoomDiff: pinchZoomCurrentDiff, panZoom };
        }

        const deltaX = prevPinchZoomDiff - pinchZoomCurrentDiff;
        const zoom = 1 - (deltaX * 2) / zoomSensitivity;
        const newScale = panZoom.scale * zoom;
        if (minScale > newScale || newScale > maxScale) {
            return null;
        }
        const worldPos = getWorldPoint(touchCenterPos, {
            scale: panZoom.scale,
            offset: panZoom.offset,
        });
        const newTouchCenterPos = getScreenPoint(worldPos, {
            scale: newScale,
            offset: panZoom.offset,
        });
        const scaleOffset = diffPoints(touchCenterPos, newTouchCenterPos);
        const offset = addPoints(panZoom.offset, scaleOffset);
        return {
            pinchZoomDiff: pinchZoomCurrentDiff,
            panZoom: { scale: newScale, offset },
        };
    } else {
        return null;
    }
};

export const getMouseCartCoord = (
    evt: TouchyEvent,
    element: HTMLCanvasElement,
    panZoom: PanZoom,
    dpr: number,
) => {
    evt.preventDefault();
    const point = getPointFromTouchyEvent(evt, element, panZoom);
    const pointCoord = { x: point.offsetX, y: point.offsetY };
    const diffPointsOfMouseOffset = getWorldPoint(pointCoord, panZoom);
    const mouseCartCoord = diffPoints(diffPointsOfMouseOffset, {
        x: element.width / dpr / 2,
        y: element.height / dpr / 2,
    });
    return mouseCartCoord;
};

export const returnScrollOffsetFromMouseOffset = (
    mouseOffset: Coord,
    panZoom: PanZoom,
    newScale: number,
) => {
    const worldPos = getWorldPoint(mouseOffset, panZoom);
    const newMousePos = getScreenPoint(worldPos, {
        scale: newScale,
        offset: panZoom.offset,
    });
    const scaleOffset = diffPoints(mouseOffset, newMousePos);
    const offset = addPoints(panZoom.offset, scaleOffset);

    return offset;
};

export const getAreaTopLeftAndBottomRight = (area: {
    startWorldPos: Coord;
    endWorldPos: Coord;
}) => {
    const isAreaFromLeftToRight = area.startWorldPos.x < area.endWorldPos.x;
    const isAreaFromTopToBottom = area.startWorldPos.y < area.endWorldPos.y;
    // To ease the algorithm, we will first identify the left top, right top, left bottom and right bottom points

    const areaTopLeftPos = {
        x: isAreaFromLeftToRight ? area.startWorldPos.x : area.endWorldPos.x,
        y: isAreaFromTopToBottom ? area.startWorldPos.y : area.endWorldPos.y,
    };
    const areaBottomRightPos = {
        x: isAreaFromLeftToRight ? area.endWorldPos.x : area.startWorldPos.x,
        y: isAreaFromTopToBottom ? area.endWorldPos.y : area.startWorldPos.y,
    };
    return { areaTopLeftPos, areaBottomRightPos };
};

export const getIsPointInsideRegion = (
    point: Coord,
    area: { startWorldPos: Coord; endWorldPos: Coord },
) => {
    const { areaTopLeftPos, areaBottomRightPos } =
        getAreaTopLeftAndBottomRight(area);

    return (
        point.x >= areaTopLeftPos.x &&
        point.x <= areaBottomRightPos.x &&
        point.y >= areaTopLeftPos.y &&
        point.y <= areaBottomRightPos.y
    );
};