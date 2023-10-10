// import React, { useEffect, useState } from "react";
// import { fabric } from "fabric";

// interface Props {
//   shapeType: "rect" | "ellipse" | "triangle" | undefined;
// }

// interface PathPoint {
//   current: fabric.Point;
//   prevControl?: fabric.Point;
//   nextControl?: fabric.Point;
// }

// const controlRadius = 4;
// const subColor = "#666";
// const pathStyle: fabric.IPathOptions = {
//   fill: "",
//   stroke: "#000",
//   objectCaching: false,
//   selectable: false,
//   hoverCursor: "default",
// };

// function Editor({ shapeType }: Props) {
//   const fabricRef = React.useRef<fabric.Canvas>();
//   const canvasRef = React.useRef<HTMLCanvasElement>(null);
//   const currentShape = React.useRef<
//     fabric.Rect | fabric.Circle | fabric.Triangle
//   >();
//   const drawingPathPoint = React.useRef<fabric.Point>();
//   const activePathObject = React.useRef<fabric.Path>();
//   const pathPoints = React.useRef<Array<PathPoint>>([]);
//   const pathNodeCircles = React.useRef<Array<fabric.Circle>>([]);
//   const pathNodeControls = React.useRef<
//     Array<Array<fabric.Circle | fabric.Line>>
//   >([]);
//   const activePathPointIndex = React.useRef<number>();
//   const tipsObject = React.useRef<fabric.Text>();

//   useEffect(() => {
//     const initFabric = () => {
//       canvasRef.current?.setAttribute("width", "320");
//       canvasRef.current?.setAttribute("height", "320");
//       fabricRef.current = new fabric.Canvas(canvasRef.current);
//     };

//     const disposeFabric = () => {
//       fabricRef.current?.dispose();
//     };

//     initFabric();

//     return () => {
//       disposeFabric();
//     };
//   }, []);

//   const getSymmetryPoint = (
//     midPoint: fabric.Point,
//     controlPoint: fabric.Point,
//   ) => {
//     return midPoint.multiply(2).subtract(controlPoint);
//   };

//   const canClosePath = (x: number, y: number) => {
//     if (!pathPoints.current) {
//       return false;
//     }
//     let ltX, ltY, rbX, rbY, cX, cY;
//     if (pathPoints.current.length < 2) {
//       return false;
//     }
//     cX = pathPoints.current[0].current.x;
//     cY = pathPoints.current[0].current.y;

//     ltX = cX - controlRadius;
//     ltY = cY - controlRadius;
//     rbX = cX + controlRadius;
//     rbY = cY + controlRadius;

//     return x >= ltX && y >= ltY && x <= rbX && y <= rbY;
//   };

//   const makeText = (text: string, options?: fabric.ITextOptions) => {
//     return new fabric.Text(text, { fill: subColor || "#666", ...options });
//   };

//   const makePathObj = (
//     paths: Array<string | number>[],
//     pathStyle?: fabric.IPathOptions,
//   ) => {
//     const pathStr = paths.reduce(
//       (str, curPaths) => (str += curPaths.join(" ")),
//       "",
//     );
//     return new fabric.Path(pathStr, pathStyle);
//   };

//   const makeControlLine = (
//     mp: fabric.Point,
//     sp?: fabric.Point,
//     ep?: fabric.Point,
//   ) => {
//     if (sp && ep) {
//       return [
//         makeLine(sp, mp),
//         makeLine(mp, ep),
//         makeCircle(sp),
//         makeCircle(mp),
//         makeCircle(ep),
//       ];
//     } else if (sp) {
//       return [makeLine(sp, mp), makeCircle(sp), makeCircle(mp)];
//     } else if (ep) {
//       return [makeLine(mp, ep), makeCircle(mp), makeCircle(ep)];
//     } else {
//       return [];
//     }
//   };
//   const canBreakPath = (x: number, y: number, altKey=false) => {
//     let ltX, ltY, rbX, rbY, cX, cY
//     if (!pathPoints.current) { return }
//     if (pathPoints.current.length === 0 || !altKey) {
//       return false
//     }
//     cX = pathPoints.current[pathPoints.current.length - 1].current.x
//     cY = pathPoints.current[pathPoints.current.length - 1].current.y

//     ltX = cX - controlRadius
//     ltY = cY - controlRadius
//     rbX = cX + controlRadius
//     rbY = cY + controlRadius
//     return x >= ltX && y >= ltY && x <= rbX && y <= rbY
//   }

//   const makePathArr = (points: PathPoint[]) => {
//     const pathArr: Array<string | number>[] = [];

//     points.forEach((item, i, arr) => {
//       let token = [];
//       if (i === 0) {
//         token = ["M", item.current.x, item.current.y];
//       } else {
//         // L or Q or C
//         const prevItem = arr[i - 1];
//         if (prevItem?.nextControl && item.prevControl) {
//           token = [
//             "C",
//             prevItem.nextControl.x,
//             prevItem.nextControl.y,
//             item.prevControl.x,
//             item.prevControl.y,
//             item.current.x,
//             item.current.y,
//           ];
//         } else if (prevItem?.nextControl) {
//           token = [
//             "Q",
//             prevItem.nextControl.x,
//             prevItem.nextControl.y,
//             item.current.x,
//             item.current.y,
//           ];
//         } else if (item?.prevControl) {
//           token = [
//             "Q",
//             item.prevControl.x,
//             item.prevControl.y,
//             item.current.x,
//             item.current.y,
//           ];
//         } else {
//           // none
//           token = ["L", item.current.x, item.current.y];
//         }
//       }
//       pathArr.push(token);
//     });

//     if (points[0].current.eq(points[points.length - 1].current)) {
//       pathArr.push(["Z"]);
//     }

//     return pathArr;
//   };

//   const drawPath = (curPoints: PathPoint[]) => {
//     if (!fabricRef.current) return;
//     if (curPoints.length === 0) {
//       const objs: fabric.Object[] = [...pathNodeCircles.current];
//       pathNodeControls.current.forEach(item => {
//         item && objs.push(...item);
//       });
//       fabricRef.current.remove(...objs);
//       fabricRef.current.requestRenderAll();
//       return;
//     }
//     // 生成
//     if (activePathObject.current) {
//       const path = activePathObject.current!.path![0];
//       // @ts-ignore
//       activePathObject.current!.path = makePathArr(curPoints);
//       // draw control line and node circle
//       curPoints.forEach((item, i, arr) => {
//         const pathNodeCircle = pathNodeCircles.current[i];
//         const pathNodeControl = pathNodeControls.current[i];
//         // draw node control line
//         if (pathNodeControl) {
//           fabricRef.current!.remove(...pathNodeControl);
//           if (i < arr.length - 2) {
//             pathNodeControl.splice(0, pathNodeControl.length);
//           } else {
//             const cl = makeControlLine(
//               item.current,
//               item.prevControl,
//               item.nextControl,
//             );
//             if (cl) {
//               pathNodeControl.splice(0, pathNodeControl.length, ...cl);
//               fabricRef.current!.add(...pathNodeControl);
//             }
//           }
//         } else if (!pathNodeControl && item?.prevControl && item?.nextControl) {
//           const cl = makeControlLine(
//             item.current,
//             item.prevControl,
//             item.nextControl,
//           );
//           pathNodeControls.current[i] = cl;
//           cl && fabricRef.current!.add(...cl);
//         }

//         // draw node circle
//         if (
//           pathNodeCircle &&
//           (pathNodeCircle.top !== item.current.y ||
//             pathNodeCircle.left !== item.current.x)
//         ) {
//           pathNodeCircle.set({
//             top: item.current.y,
//             left: item.current.x,
//           });
//         } else if (!pathNodeCircle) {
//           pathNodeCircles.current.push(makeCircle(item.current));
//           fabricRef.current!.add(
//             pathNodeCircles.current[pathNodeCircles.current.length - 1],
//           );
//         }
//       });
//     } else {
//       activePathObject.current = new fabric.Path(
//         `M ${curPoints[0]?.current.x} ${curPoints[0]?.current.y}`,
//         {
//           fill: "",
//           stroke: "#000",
//           ...pathStyle,
//           objectCaching: false,
//           selectable: false,
//           hoverCursor: "default",
//         },
//       );
//       pathNodeControls.current =
//         curPoints[0]?.prevControl && curPoints[0]?.nextControl
//           ? [
//               makeControlLine(
//                 curPoints[0].current,
//                 curPoints[0].prevControl,
//                 curPoints[0].nextControl,
//               ),
//             ]
//           : [];
//       pathNodeCircles.current = [makeCircle(curPoints[0]?.current)];
//       fabricRef.current.add(
//         activePathObject.current,
//         pathNodeCircles.current[0],
//       );
//       pathNodeControls.current[0] &&
//         fabricRef.current.add(...pathNodeControls.current[0]);
//     }
//     fabricRef.current.requestRenderAll();
//   };

//   const makeCircle = (point: fabric.Point, options?: fabric.ICircleOptions) => {
//     return new fabric.Circle({
//       fill: subColor || "#666",
//       top: point.y,
//       left: point.x,
//       radius: controlRadius || 4,
//       originX: "center",
//       originY: "center",
//       selectable: false,
//       hoverCursor: "default",
//       ...options,
//     });
//   };

//   const makeLine = (
//     sp: fabric.Point,
//     ep: fabric.Point,
//     options?: fabric.ILineOptions,
//   ) => {
//     return new fabric.Line([sp.x, sp.y, ep.x, ep.y], {
//       stroke: subColor || "#666",
//       strokeWidth: 1,
//       selectable: false,
//       evented: false,
//       hoverCursor: "default",
//       ...options,
//     });
//   };

//   const setTipsObj = (text?: string, point?: fabric.Point) => {
//     if (!fabricRef.current) return;
//     if (text && point && tipsObject.current) {
//       // Modify
//       tipsObject.current.set({
//         top: point.y,
//         left: point.x,
//         text: text,
//       });
//     } else if (point && text) {
//       tipsObject.current = makeText(text, {
//         top: point.y,
//         left: point.x,
//         fontSize: 12,
//       });

//       fabricRef.current.add(tipsObject.current);
//     } else if (tipsObject.current) {
//       fabricRef.current.remove(tipsObject.current);
//       tipsObject.current = undefined;
//     }
//     fabricRef.current.requestRenderAll();
//   };

//   useEffect(() => {
//     if (!fabricRef.current) return;
//     const onMouseDownHandler = (event: fabric.IEvent) => {
//       let { x, y } = fabricRef.current!.getPointer(event.e);
//       console.log(x, y);
//       if (activePathObject.current) {
//         if (canClosePath(x, y)) {
//           pathPoints.current = [
//             ...pathPoints.current,
//             { current: pathPoints.current[0].current },
//           ];
//           // this.isClosedPath = true
//         } else if ()
//       } else {
//         pathPoints.current = [];
//         drawingPathPoint.current = new fabric.Point(x, y);
//         pathPoints.current = [{ current: new fabric.Point(x, y) }];
//         activePathPointIndex.current = 0;
//       }
//     };

//     const onMouseMoveHandler = (event: fabric.IEvent) => {
//       if (!shapeType) return;
//       // we could already be clicking a shape
//       if (activePathObject.current) {
//         const { x, y } = fabricRef.current!.getPointer(event.e);
//         if (activePathPointIndex.current == undefined) {
//           return;
//         }
//         const controlPoint = getSymmetryPoint(
//           pathPoints.current[activePathPointIndex.current].current,
//           new fabric.Point(x, y),
//         );
//         pathPoints.current = pathPoints.current.map((item, index) => {
//           if (index === activePathPointIndex.current) {
//             return {
//               current: pathPoints.current[activePathPointIndex.current].current,
//               prevControl: controlPoint,
//               nextControl: new fabric.Point(x, y),
//             };
//           }
//           return item;
//         });
//         if (canClosePath(x, y)) {
//           setTipsObj("Close Path", new fabric.Point(x, y));
//         } else {
//           tipsObject.current && setTipsObj();
//         }
//       }
//     };

//     const onMouseUpHandler = (event: fabric.IEvent) => {
//       if (!currentShape.current) return;
//       if (
//         (currentShape.current.width &&
//           Math.abs(currentShape.current.width) < 1) ||
//         (currentShape.current.height &&
//           Math.abs(currentShape.current.height) < 1)
//       ) {
//         fabricRef.current?.remove(currentShape.current);

//         return;
//       }
//       const allObjects = fabricRef.current!.getObjects();
//       allObjects.forEach(object => {
//         object.selectable = true;
//       });
//       const json = JSON.stringify(fabricRef.current?.toJSON());
//       currentShape.current = undefined;
//     };

//     fabricRef.current.on("mouse:down", onMouseDownHandler);
//     fabricRef.current.on("mouse:move", onMouseMoveHandler);
//     fabricRef.current.on("mouse:up", onMouseUpHandler);

//     return () => {
//       fabricRef.current?.off("mouse:down", onMouseDownHandler);
//       fabricRef.current?.off("mouse:move", onMouseMoveHandler);
//       fabricRef.current?.off("mouse:up", onMouseUpHandler);
//     };
//   }, [shapeType, fabricRef]);

//   return (
//     <canvas
//       style={{
//         border: "1px solid black",
//       }}
//       ref={canvasRef}
//     />
//   );
// }

// export default Editor;
