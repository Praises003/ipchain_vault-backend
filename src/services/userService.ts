import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getUserProfile = async(userId: string) => {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        verified: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
}

export const updateUser = async (
  userId: string,
  data: { name?: string; email?: string }
) => {
  const { name, email } = data;

  // Check if new email is provided and different from current
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email is already in use by another account.');
    }
  }

  return await prisma.user.update({
    where: { id: userId },
    data: { name, email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      verified: true,
    },
  });
};
