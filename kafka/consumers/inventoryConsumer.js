import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'inventory-service',
  brokers: ['localhost:9092'], // adjust if Kafka is on a different host/port
});

const consumer = kafka.consumer({ groupId: 'inventory-service' });

const startInventoryConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-placed', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      console.log('📦 Inventory reacting to order:', order);
      // Deduct inventory logic here
    },
  });
};

startInventoryConsumer();
