import { ModelInputs, ModelOutput } from "@/types/replicate";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_TOKEN!,
});

export const generateOutputs = async ({
  prompt,
  negative_prompt,
  image,
  seed,
  num_outputs,
  width,
  height,
}: ModelInputs) => {
  const outputs = await replicate.run(
    "ai-forever/kandinsky-2-1:a768f3c2e174c54b576cc4f222e789e161160403d0cd0ace41eeb9a0f8c8d5f8",
    {
      input: {
        task: image ? "text_guided_img2img" : "text2img",
        prompt,
        negative_prompt,
        image,
        seed,
        num_outputs: 1,
        width: width ? width : 128, // 128 is the smallest size
        height: height ? height : 128,
      },
    },
    (progress) => console.log("progress", progress)
  );
  console.log("outputs", outputs);
  return outputs;
};
