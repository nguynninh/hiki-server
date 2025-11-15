import Minio from "minio";

export const AWS_ENDPOINT = process.env.AWS_ENDPOINT || "http://localhost:9000";
const url = new URL(AWS_ENDPOINT);

export const minioClient = new Minio.Client({
  endPoint: url.hostname,
  port: Number(url.port) || 9000,
  useSSL: url.protocol === "https:",
  accessKey: process.env.AWS_ACCESS_KEY_ID || "minioadmin",
  secretKey: process.env.AWS_SECRET_ACCESS_KEY || "minioadmin",
});

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "hiki-files";
export const AWS_REGION = process.env.AWS_REGION || "us-east-1";

export const FORDER_BUCKET = {
  images: 'images',
  videos: 'videos',
}

export default minioClient;
