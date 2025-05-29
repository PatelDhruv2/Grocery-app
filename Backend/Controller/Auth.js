import dotenv from 'dotenv';
dotenv.config(); // Load .env variables

import prisma from '../config/db.config.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateOtp, sendOtp } from '../utils/otp.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

// In-memory OTP store
const otpStore = new Map();

// Signup controller
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        isVerified: false,
        isAdmin: false,
      },
    });

    const otp = generateOtp();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes

    await sendOtp(email, otp);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Signin controller
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin request:', req.body);
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    console.log('User found:', user);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid  password' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Email not verified. Please verify OTP.' });
    }

    const token ='Bearer '+ jwt.sign(
      { userId: user.id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Generated token:', token);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Send OTP again
export const sendOtpToUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOtp();
    otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    await sendOtp(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP Error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const entry = otpStore.get(email);
  if (!entry) return res.status(400).json({ error: 'No OTP found for this email' });

  const { otp: storedOtp, expiresAt } = entry;

  if (Date.now() > expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (otp !== storedOtp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(email);

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    const token = 'Bearer '+jwt.sign(
      {
        userId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
   
    res.json({
      message: 'OTP verified successfully. Email is now verified.',
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
};
