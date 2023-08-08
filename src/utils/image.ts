import { PixelModifyItem } from "dotting";

const GRID_SQUARE_LENGTH = 20;

export const createImageOutOfNestedColorArray = (
  nestedColorArray: PixelModifyItem[][]
) => {
  const imageCanvas = document.createElement("canvas");
  const rowCount = nestedColorArray.length;
  const columnCount = nestedColorArray[0].length;
  imageCanvas.width = columnCount * GRID_SQUARE_LENGTH;
  imageCanvas.height = rowCount * GRID_SQUARE_LENGTH;
  const imageContext = imageCanvas.getContext("2d")!;
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < columnCount; j++) {
      const pixelCoord = {
        x: j * GRID_SQUARE_LENGTH,
        y: i * GRID_SQUARE_LENGTH,
      };
      imageContext.save();
      imageContext.fillStyle = nestedColorArray[i][j].color;
      imageContext.fillRect(
        pixelCoord.x,
        pixelCoord.y,
        GRID_SQUARE_LENGTH,
        GRID_SQUARE_LENGTH
      );
      imageContext.restore();
    }
  }
  imageContext.save();
  const dataURL = imageCanvas.toDataURL("image/png");
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
  return new Promise((resolve) => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};
