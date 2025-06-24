import { z } from "zod";


export const userUpdateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long."), // Validate name
  email: z.string().email("Invalid email address."), // Validate email format
  password: z.string().min(8, "Password must be at least 8 characters long."), // Validate password length
});