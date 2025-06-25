// src/types/express/index.d.ts (or any .d.ts file you load with TS)
import { AuthPayload } from "../middlewares/authMiddleware"

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload,
       rawBody: Buffer;
    }
  }
}
