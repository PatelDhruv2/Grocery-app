import { Router } from "express";
import {signup,signin,getProfile,requestPasswordReset,resetPassword} from "../Controller/Auth.js";
import { createProduct } from "../Controller/Product.js";
import {verifyOtp} from '../Controller/Auth.js'
const router = Router();
import upload from '../Upload.js';
import authenticate from "../middleware/middleware.js";
// Adjust the path to your Upload.js file
router.post('/gg', upload.single('photo'), createProduct);
router.post('/userRegister', signup);
router.post('/userLogin', signin);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post('/verify-otp',verifyOtp)
router.get('/profile', authenticate, getProfile);
export default router;
