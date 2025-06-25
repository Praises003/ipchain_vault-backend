import { PrismaClient } from "../generated/prisma"
const prisma = new PrismaClient();

export const createLicensePlanService = async (
  userId: string,
  assetId: string,
  data: { name: string; price: number; licenseTerms: string }
) => {
  // Verify asset ownership
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');
  if (asset.userId !== userId) throw new Error('Unauthorized to add license plans');

  // Create license plan
  return prisma.licensePlan.create({
    data: {
      assetId,
      name: data.name,
      price: data.price,
      licenseTerms: data.licenseTerms,
    },
  });
};

export const getLicensePlansByAssetService = async (assetId: string) => {
  return prisma.licensePlan.findMany({
    where: { assetId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getUserLicensesService = async (userId: string) => {
  return prisma.license.findMany({
    where: { buyerId: userId },
    include: {
      asset: true,
      licensePlan: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getLicenseByIdService = async (licenseId: string, userId: string) => {
  return prisma.license.findFirst({
    where: { id: licenseId, buyerId: userId },
    include: {
      asset: true,
      licensePlan: true,
    },
  });
};


// For admin or reporting purposes: get all licenses
export const getAllLicensesService = async () => {
  return prisma.license.findMany({
    include: {
      asset: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
      licensePlan: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};
