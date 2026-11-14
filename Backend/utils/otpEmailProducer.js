import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";

const kafka = new Kafka({
  clientId: "otp-email-producer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();
let connectPromise;

const ensureProducerConnected = async () => {
  if (!connectPromise) {
    connectPromise = producer.connect().catch((error) => {
      connectPromise = undefined;
      throw error;
    });
  }
  return connectPromise;
};

let directTransporter = null;
const getDirectTransporter = () => {
  if (!directTransporter && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    directTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return directTransporter;
};

export const queueOtpEmail = async (email, otp) => {
  if (process.env.KAFKA_BROKER) {
    try {
      await ensureProducerConnected();
      await producer.send({
        topic: "otp-email",
        messages: [{ value: JSON.stringify({ email, otp }) }],
      });
      console.log(`Queued OTP email to Kafka for ${email}`);
      return;
    } catch (error) {
      console.warn("Kafka produce failed, attempting direct email send:", error.message);
    }
  }

  const transporter = getDirectTransporter();
  if (!transporter) {
    throw new Error("Configure EMAIL_USER and EMAIL_PASS to send verification emails.");
  }
  await transporter.sendMail({
    from: `"My Basket" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code - My Basket",
    text: `Your OTP code is: ${otp}\nIt will expire in 10 minutes.`,
    html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Password Reset Request</h2>
          <p>Your one-time password (OTP) to reset your password is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #16a34a;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
        </div>
    `,
  });
  console.log(`Direct OTP email sent successfully to ${email}`);
};

