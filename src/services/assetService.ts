import { PrismaClient } from '../generated/prisma';
import cloudinary from '../utils/cloudinary';
import crypto from 'crypto';
import fs from 'fs';


const prisma = new PrismaClient();
export const uploadAssetService = async (
  userId: string,
  filePath: string,
  title: string,
  description: string
) => {
  // 1. Hash the file
  const buffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // 2. Check for duplicates
  const existing = await prisma.asset.findUnique({ where: { hash } });
  if (existing) {
    throw new Error('Duplicate asset detected');
  }

  // 3. Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(filePath, {
    folder: 'ipchain/assets',
    resource_type: 'auto',
  });

  // 4. Create asset in DB
  const asset = await prisma.asset.create({
    data: {
      userId,
      title,
      description,
      fileUrl: uploadResult.secure_url,
      hash,
      status: 'protected',
    },
  });

  // 5. Cleanup local file if needed
  fs.unlinkSync(filePath);

  return asset;
};


export const getUserAssetsService = async (userId: string) => {
  return prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};


export const getAssetByIdService = async (id: string, userId: string) => {
  return prisma.asset.findFirst({
    where: { id, userId },
  });
};


export const updateAssetService = async (id: string, userId: string, data: { title?: string; description?: string }) => {
  return prisma.asset.updateMany({
    where: { id, userId },
    data,
  });
};

export const deleteAssetService = async (id: string, userId: string) => {
  return prisma.asset.deleteMany({
    where: { id, userId },
  });
};


