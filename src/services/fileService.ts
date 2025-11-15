import crypto from "crypto";
import uuid from "uuid";
import minioClient, { AWS_REGION, BUCKET_NAME, FORDER_BUCKET, AWS_ENDPOINT } from "../configuration/minioClient";
import { FileMgmtModel } from "../models";

async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, AWS_REGION);
  }
}

export async function uploadImage(
  ownerId: string,
  file: Express.Multer.File
): Promise<any> {
  await ensureBucketExists();

  const fileName = uuid.v4();
  const objectPath = `${FORDER_BUCKET.images}/${fileName}`;

  await minioClient.putObject(
    BUCKET_NAME,
    objectPath,
    file.buffer,
    file.size,
    { "Content-Type": file.mimetype }
  );

  const md5Hash = crypto.createHash("md5")
    .update(file.buffer)
    .digest("hex");

  const fileRecord = await FileMgmtModel.create({
    objectPath,
    content_type: file.mimetype,
    size: file.size,
    md5_checksum: md5Hash,
    uploaded_by: ownerId,
  });

  const publicUrl = `${AWS_ENDPOINT}/${BUCKET_NAME}/${objectPath}`;

  return { fileRecord, publicUrl };
}