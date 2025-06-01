  // orderproducer.js
  import { Kafka } from 'kafkajs';

  const kafka = new Kafka({
    clientId: 'order-service',
    brokers: ['localhost:9092'],
  });

  const producer = kafka.producer();

  const publishOrder = async (order) => {
    await producer.connect();
    await producer.send({
      topic: 'order-placed',
      messages: [{ value: JSON.stringify(order) }],
    });
    console.log("gg",order);
    console.log('✅ Order published to Kafka:', order.orderId);
    await producer.disconnect();
  };
  export default publishOrder;
