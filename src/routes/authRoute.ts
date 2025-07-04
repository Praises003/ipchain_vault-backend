import { Router } from "express";
import { Request, Response } from "express";
import { register, login, verifyOtp, forgotPassword, resetPassword, logout, resendOtp, refreshAccessToken, checkAuth } from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";

const router: Router = Router();

router.post("/register",  register);
router.post("/login", login );
router.post("/verifyOTP", verifyOtp) 
router.post("/forgotPassword", forgotPassword)
router.post("/reset-password",authenticate, resetPassword);
router.post("/logout", logout);
router.post("/resend-otp", resendOtp)
router.post("/refresh-token", refreshAccessToken) 
router.get("/check-auth", authenticate, checkAuth)



export default router;
