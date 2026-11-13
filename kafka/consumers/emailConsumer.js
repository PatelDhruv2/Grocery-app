import { Kafka } from "kafkajs";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const kafka = new Kafka({
  clientId: "email-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const consumer = kafka.consumer({ groupId: "email-group" });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOrderEmail = async (order) => {
  await transporter.sendMail({
    from: `"BigBasket Clone" <${process.env.EMAIL_USER}>`,
    to: order.userEmail,
    subject: `Order Confirmation - Order #${order.orderId}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      <ul>${order.items.map((item) => `
        <li>Product ID: ${item.productId}, Quantity: ${item.quantity}, Price: ₹${item.price}</li>
      `).join("")}</ul>
    `,
  });
};

const sendOtpEmail = async ({ email, otp }) => {
  await transporter.sendMail({
    from: `"BigBasket Clone" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}\nIt will expire in 10 minutes.`,
  });
  console.log(`OTP email sent to ${email}`);
};

const startEmailConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topics: ["order-placed", "otp-email"],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const payload = JSON.parse(message.value.toString());
      try {
        if (topic === "otp-email") {
          await sendOtpEmail(payload);
        } else {
          await sendOrderEmail(payload);
          console.log(`Order confirmation sent for ${payload.orderId}`);
        }
      } catch (error) {
        console.error(`Email delivery failed for ${topic}:`, error);
      }
    },
  });
};

startEmailConsumer().catch((error) => {
  console.error("Email consumer failed to start:", error);
  process.exitCode = 1;
});
