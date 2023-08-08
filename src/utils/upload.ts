import AWS from "aws-sdk";
import { getNewGUIDString } from "./guid";

export const imageFileUpload = async (file: Blob) => {
  AWS.config.update({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  console.log(
    process.env.S3_REGION,
    process.env.S3_ACCESS_KEY,
    process.env.S3_SECRET_KEY
  );
  const s3 = new AWS.S3({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
  const upload = await s3
    .upload({
      Bucket: "pixel-genai",
      Body: file,
      Key: getNewGUIDString(),
      ContentType: file.type,
    })
    .promise();

  return upload.Location;
};
