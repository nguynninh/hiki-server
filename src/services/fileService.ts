import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
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

  const fileName = uuidv4();
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
    path: objectPath,
    content_type: file.mimetype,
    size: file.size,
    md5_checksum: md5Hash,
    uploaded_by: ownerId,
  });

  const publicUrl = `${AWS_ENDPOINT}/${BUCKET_NAME}/${objectPath}`;

  return { fileRecord, publicUrl };
}

export async function deleteFile(fileId: string): Promise<void> {
  const fileRecord: any = await FileMgmtModel.findByPk(fileId);
  if (fileRecord) {
    await minioClient.removeObject(BUCKET_NAME, fileRecord.path);
    await fileRecord.destroy();
  }
}

export async function getFileUrl(fileId: string): Promise<string | null> {
  const fileRecord: any = await FileMgmtModel.findByPk(fileId);
  return fileRecord ? `${AWS_ENDPOINT}/${BUCKET_NAME}/${fileRecord.path}`: null;
}