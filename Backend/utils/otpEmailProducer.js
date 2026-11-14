import { Kafka } from "kafkajs";

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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Configure RESEND_API_KEY to send verification emails.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "My Basket <onboarding@resend.dev>",
      to: [email],
      subject: "Your OTP Code - My Basket",
      text: `Your OTP code is: ${otp}\nIt will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Your My Basket verification code</h2>
          <p>Your one-time password is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #16a34a;">
            ${otp}
          </div>
          <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email request failed (${response.status}): ${detail}`);
  }

  console.log(`OTP email sent through Resend to ${email}`);
};

