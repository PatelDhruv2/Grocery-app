import { Kafka } from 'kafkajs';
import bcrypt from 'bcrypt';
import prisma from '../config/db.config.js'; // Adjust the import path as necessary
const kafka = new Kafka({ 
  clientId: 'signup-worker', 
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] 
});
const consumer = kafka.consumer({ groupId: 'signup-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'signup-requests', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { name, email, password, phone, address } = JSON.parse(message.value.toString());
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return;

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: { name, email, password: hashedPassword, phone, address },
      });
      console.log(`User ${email} created.`);
    },
  });
}

run().catch(console.error);
