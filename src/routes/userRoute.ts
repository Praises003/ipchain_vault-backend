import { Router } from "express";


import { authenticate } from "../middlewares/authMiddleware";
import { getUserProfile, updateUser } from "../controllers/userController";
const router:Router = Router()

router.get('/profile', authenticate, getUserProfile);
router.put('/update', authenticate, updateUser);

export default router;