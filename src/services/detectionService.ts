import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import axios from 'axios';

interface RunDetectionInput {
  assetId: string;
  userId: string;
  imageUrl?: string;
  saveResult?: boolean;
}

// export const runDetectionService = async ({
//   assetId,
//   userId,
//   imageUrl,
//   saveResult = false,
// }: RunDetectionInput) => {
//   const asset = await prisma.asset.findUnique({ where: { id: assetId } });
//   if (!asset) throw new Error("Asset not found");

//   const imageToSearch = imageUrl || asset.fileUrl;
//   const serpApiKey = process.env.SERP_API_KEY!;

//   const serpRes = await axios.get("https://serpapi.com/search", {
//     params: {
//       engine: "google_lens",
//       url: imageToSearch,
//       api_key: serpApiKey,
//     },
//   });

//   const results = serpRes.data?.visual_matches || [];
//   const topMatch = results.length > 0 ? results : null;

//   const detectionData = {
//     userId,
//     assetId,
//     imageUrl: imageToSearch,
//     matchedUrl: topMatch?.link || null,
//     similarity: topMatch ? 0.9 : 0.0,
//     detectionType: "image",
//     status: topMatch ? "matched" : "no-match",
//     notes: topMatch?.title || "No match found",
//     screenshotUrl: topMatch?.thumbnail || null,
//   };

//   if (topMatch || saveResult) {
//     const detection = await prisma.detectionResult.create({ data: detectionData });
//     return detection;
//   }

//   // If not saving to DB, return a "virtual" detection result
//   return { ...detectionData, id: null, saved: false };
// };

export const runDetectionService = async ({
  assetId,
  userId,
  imageUrl,
  saveResult = false,
  page = 1,
  limit = 10,
}: RunDetectionInput & { page?: number, limit?: number }) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Asset not found");

  const imageToSearch = imageUrl || asset.fileUrl;
  const serpApiKey = process.env.SERP_API_KEY!;

  const serpRes = await axios.get("https://serpapi.com/search", {
    params: {
      engine: "google_lens",
      url: imageToSearch,
      api_key: serpApiKey,
    },
  });

  const results = serpRes.data?.visual_matches || [];
  
  // Apply pagination: calculate the skip and limit based on page and limit
  const skip = (page - 1) * limit;
  const paginatedResults = results.slice(skip, skip + limit);

  if (results.length === 0) {
    return {
      userId,
      assetId,
      imageUrl: imageToSearch,
      matchedUrl: null,
      source: null,
      sourceIcon: null,
      similarity: 0.0,
      detectionType: "image",
      status: "no-match",
      notes: "No match found",
      screenshotUrl: null,
      saved: false,
    };
  }

  // Prepare detection data for each match
  const detectionData = paginatedResults.map((match: any) => ({
    userId,
    assetId,
    imageUrl: imageToSearch,
    matchedUrl: match.link || null,
    source: match.source || null, // Optional: if source is available
    sourceIcon: match.source_icon || null, // Optional: if source icon is available
    similarity: 0.9, // Adjust similarity based on match relevance
    detectionType: "image",
    status: "matched",
    notes: match.title || "No title",
    screenshotUrl: match.thumbnail || null,
  }));

  // If saving results to DB or any of the results, store them in the database
  if (saveResult) {
    const savedDetections = await prisma.detectionResult.createMany({
      data: detectionData,
    });
    return savedDetections;
  }

  // If not saving, return the data as "virtual" detections
  return detectionData.map((detection: any) => ({
    ...detection,
    id: null, // Mark as unsaved
    saved: false,
  }));
};



export const getUserDetections = async (userId: string) => {
  return prisma.detectionResult.findMany({
    where: { userId },
    orderBy: { detectionDate: "desc" },
  });
};

export const getDetectionById = async (id: string, userId: string) => {
  const result = await prisma.detectionResult.findUnique({
    where: { id },
    include: { matches: true },
  });

  if (!result || result.userId !== userId) {
    throw new Error("Detection result not found or unauthorized");
  }

  return result;
};