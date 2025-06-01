import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'test-producer',
  brokers: ['localhost:9092'],
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();
  await producer.send({
    topic: 'test-topic',
    messages: [{ value: 'Hello Kafka from producer!' }],
  });
  console.log('✅ Message sent');
  await producer.disconnect();
};

run().catch(console.error);
