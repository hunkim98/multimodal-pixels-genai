import { PixelModifyItem } from "dotting";

const GRID_SQUARE_LENGTH = 10;

export const createImageOutOfNestedColorArray = (
  nestedColorArray: PixelModifyItem[][],
) => {
  const imageCanvas = document.createElement("canvas");
  const rowCount = nestedColorArray.length;
  const columnCount = nestedColorArray[0].length;
  imageCanvas.width = 512;
  imageCanvas.height = 512;
  const imageContext = imageCanvas.getContext("2d")!;
  imageContext.save();
  imageContext.fillStyle = "#ffffff";
  imageContext.fillRect(0, 0, 512, 512);
  imageContext.restore();

  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < columnCount; j++) {
      if (!nestedColorArray[i][j].color) continue;
      const pixelCoord = {
        x: (j * 512) / rowCount,
        y: (i * 512) / columnCount,
      };
      imageContext.save();
      imageContext.fillStyle = nestedColorArray[i][j].color;
      imageContext.fillRect(
        pixelCoord.x,
        pixelCoord.y,
        (GRID_SQUARE_LENGTH * 512) / 320,
        (GRID_SQUARE_LENGTH * 512) / 320,
      );
      imageContext.restore();
    }
  }
  imageContext.save();
  return makeCanvasToImageBlob(imageCanvas);
};

export const createImageFromPartOfCanvas = (
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
  canvasWidth: number,
  canvasHeight: number,
  width: number,
  height: number,
  dpr: number,
) => {
  const imageCanvas = document.createElement("canvas");
  const tempContext = imageCanvas.getContext("2d")!;
  tempContext.scale(dpr, dpr);

  imageCanvas.width = width;
  imageCanvas.height = height;
  tempContext.fillStyle = "#ffffff";
  tempContext.fillRect(0, 0, width, height);
  tempContext.drawImage(
    canvas,
    offsetX,
    offsetY,
    canvasWidth,
    canvasHeight,
    0,
    0,
    width,
    height,
  );
  return makeCanvasToImageBlob(imageCanvas);
};

export const makeCanvasToImageBlob = (canvas: HTMLCanvasElement) => {
  const dataURL = canvas.toDataURL("image/png");
  const blobBin = atob(dataURL.split(",")[1]);
  const array = [];
  for (var i = 0; i < blobBin.length; i++) {
    array.push(blobBin.charCodeAt(i));
  }
  const file = new Blob([new Uint8Array(array)], { type: "image/png" });
  return file;
};

export const blobToBase64 = (blob: Blob) => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};
