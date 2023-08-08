// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ModelInputs } from "@/types/replicate";
import type { NextApiRequest, NextApiResponse } from "next";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_TOKEN!,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const body = req.body as ModelInputs;
    const output = await generateOutputs(body);
    console.log("output", output);
    res.status(200).json(output);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export const generateOutputs = async ({
  prompt,
  negative_prompt,
  image,
  seed,
  num_outputs,
  width,
  height,
}: ModelInputs) => {
  const output = await replicate.run(
    "ai-forever/kandinsky-2-1:a768f3c2e174c54b576cc4f222e789e161160403d0cd0ace41eeb9a0f8c8d5f8",
    {
      input: {
        task: image ? "text_guided_img2img" : "text2img",
        prompt,
        negative_prompt,
        image,
        seed,
        num_outputs: 1,
        width: width ? width : 512, // 128 is the smallest size
        height: height ? height : 512,
        num_steps_prior: 50,
      },
    },
    (progress) => console.log("progress", progress)
  );
  console.log("output", output);
  return output;
};
