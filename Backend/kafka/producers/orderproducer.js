import { Kafka, Partitioners } from "kafkajs";

const kafka = new Kafka({
  clientId: "order-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

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

const publishOrder = async (order) => {
  await ensureProducerConnected();
  await producer.send({
    topic: "order-placed",
    messages: [{ value: JSON.stringify(order) }],
  });
  console.log("Order published to Kafka:", order.orderId);
};

export default publishOrder;
