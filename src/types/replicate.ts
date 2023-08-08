export type ModelInputs = {
  prompt: string;
  negative_prompt?: string;
  image?: File;
  seed?: number;
  num_outputs?: number;
  width?: number;
  height?: number;
};

export type ModelOutput = {
  type: string;
  items: {
    type: string;
    format: string;
  };
  title: string;
};
