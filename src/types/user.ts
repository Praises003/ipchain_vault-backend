export interface JwtUserPayload {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN'; // or import from Prisma enum
}
