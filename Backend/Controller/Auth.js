import dotenv from "dotenv";
dotenv.config();

import prisma from "../config/db.config.js";
import redisClient from "../config/redis.config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { generateOtp } from "../utils/otp.js";
import { queueOtpEmail } from "../utils/otpEmailProducer.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";
const otpKey = (email) => `otp:${normalizeEmail(email)}`;
const createAndSendOtp = async (email) => {
  const otp = generateOtp();
  await redisClient.set(otpKey(email), otp, { EX: 10 * 60 });
  await queueOtpEmail(email, otp);
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (existingUser) {
      if (!existingUser.isVerified) {
        const passwordMatches = await bcrypt.compare(password, existingUser.password);
        if (passwordMatches) {
          try {
            await createAndSendOtp(normalizedEmail);
          } catch (error) {
            console.error("OTP delivery failed:", error);
            return res.status(503).json({
              message: "Your account is saved, but the verification email could not be sent. Please try again later.",
            });
          }

          return res.status(200).json({
            message: "A new verification code has been queued for email delivery.",
            user: { id: existingUser.id, email: existingUser.email },
          });
        }
      }

      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone,
        address,
        isVerified: false,
        isAdmin: false,
      },
    });

    await redisClient.del("stats:totalusers");

    try {
      await createAndSendOtp(normalizedEmail);
    } catch (error) {
      console.error("OTP delivery failed:", error);
      return res.status(503).json({
        message: "Your account is saved, but the verification email could not be sent. Please try again later.",
      });
    }

    res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify OTP." });
    }

    const token =
      "Bearer " +
      jwt.sign(
        { userId: user.id, email: user.email, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const sendOtpToUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOtp();
    await redisClient.set(otpKey(email), otp, { EX: 10 * 60 });
    await queueOtpEmail(email, otp);

    res.json({ message: "OTP queued for email delivery" });
  } catch (err) {
    console.error("OTP Error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = typeof otp === "string" ? otp.trim() : String(otp ?? "").trim();

  try {
    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const storedOtp = await redisClient.get(otpKey(normalizedEmail));
    if (!storedOtp) {
      return res.status(400).json({ message: "No active OTP found for this email. Request a new one." });
    }

    if (normalizedOtp !== String(storedOtp).trim()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    await redisClient.del(otpKey(normalizedEmail));

    const token =
      "Bearer " +
      jwt.sign(
        {
          userId: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

    res.json({
      message: "OTP verified successfully. Email is now verified.",
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Failed to update verification status" });
  }
};
