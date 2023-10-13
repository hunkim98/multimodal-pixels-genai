// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { ModelInputs } from "@/types/replicate";
import { createImageOutOfNestedColorArray } from "@/utils/image";
import type { NextApiRequest, NextApiResponse } from "next";

// const replicate = new Replicate({
//   auth: process.env.REPLICATE_TOKEN!,
// });

var getPredictionUrl = "";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const body = req.body as ModelInputs;
    // const output = await generateOutputs(body);
    const firstResponse = await new Promise(function (resolve, reject) {
      // generateOutputs(body).then(function (result) {
      //   resolve(result);
      // });
      // startPredictionGetIdTimer().then(function (result) {
      //   resolve(result);
      // });
    });
    res.status(200).json(firstResponse);
    getPredictionUrl = "";
  } else if (req.method === "GET") {
    res.status(405).json({ error: "Method not allowed" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
    getPredictionUrl = "";
  }
}

export const startPredictionGetIdTimer = () => {
  return new Promise(function (resolve, reject) {
    const interval = setInterval(function () {
      if (getPredictionUrl != "") {
        resolve(getPredictionUrl);
        clearInterval(interval);
      }
      console.log("is this running?");
    }, 100);
  });
};

// export const generateOutputs = async ({
//   prompt,
//   negative_prompt,
//   image,
//   seed,
//   num_outputs,
//   strength,
//   width,
//   height,
// }: ModelInputs) => {
//   const output = await replicate.run(
//     "ai-forever/kandinsky-2-1:a768f3c2e174c54b576cc4f222e789e161160403d0cd0ace41eeb9a0f8c8d5f8",
//     {
//       input: {
//         task: image ? "text_guided_img2img" : "text2img",
//         prompt,
//         negative_prompt: negative_prompt
//           ? negative_prompt
//           : "low quality, bad quality, bad resolution",
//         strength,
//         image,
//         seed,
//         num_outputs: 1,
//         width: width ? width : 512, // 128 is the smallest size
//         height: height ? height : 512,
//         num_steps_prior: 50,
//       },
//     },
//     progress => {
//       if (progress.urls.get) {
//         console.log("progress.urls.get", progress.urls.get);
//         getPredictionUrl = progress.urls.get;
//         Promise.resolve(progress.urls.get);
//       }
//     },
//   );
//   return output;
// };
