import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import minioClient, { AWS_REGION, BUCKET_NAME, FORDER_BUCKET, AWS_ENDPOINT } from "../configuration/minioClient";
import { FileMgmtModel } from "../models";

async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, AWS_REGION);
  }
  
  const policy = {
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${BUCKET_NAME}/${FORDER_BUCKET.images}/*`]
    }]
  };
  
  await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
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
  if (!fileRecord) return null;
  
  return `${AWS_ENDPOINT}/${BUCKET_NAME}/${fileRecord.path}`;
}