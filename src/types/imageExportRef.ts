export interface ImageExportRef {
  getBase64Image: () => Promise<string | undefined>;
}
