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
  await ensureProducerConnected();
  await producer.send({
    topic: "otp-email",
    messages: [{ value: JSON.stringify({ email, otp }) }],
  });
};
