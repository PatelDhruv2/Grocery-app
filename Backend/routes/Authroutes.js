import { Router } from "express";
import {signup,signin} from "../Controller/Auth.js";
import { createProduct } from "../Controller/Product.js";
import {verifyOtp} from '../Controller/Auth.js'
const router = Router();
import upload from '../Upload.js';
// Adjust the path to your Upload.js file
router.post('/gg', upload.single('photo'), createProduct);
router.post('/userRegister', signup);
router.post('/userLogin', signin);
router.post('/verify-otp',verifyOtp)
export default router;