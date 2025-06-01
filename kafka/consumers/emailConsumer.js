import { Kafka } from 'kafkajs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
// 1. Kafka instance
const kafka = new Kafka({
  clientId: 'email-service',
  brokers: ['localhost:9092'], // update if needed
});

// 2. Kafka consumer instance
const consumer = kafka.consumer({ groupId: 'email-group' });

// 3. Mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,  
    pass: EMAIL_PASS, 
  },
});

// 4. Send confirmation email
const sendEmail = async (order) => {
  const mailOptions = {
   from: '"BigBasket Clone" <freal07Daddy@gmail.com>',
    to: order.userEmail,
    subject: `Order Confirmation - Order #${order.orderId}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      <ul>
        ${order.items.map(item => `
          <li>Product ID: ${item.productId}, Quantity: ${item.quantity}, Price: ₹${item.price}</li>
        `).join('')}
      </ul>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// 5. Start consuming messages
const startEmailConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'order-placed', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const order = JSON.parse(message.value.toString());
      console.log('📧 Sending email for order:', order.orderId);
      try {
        await sendEmail(order);
        console.log('✅ Email sent!');
      } catch (err) {
        console.error('❌ Email send failed:', err);
      }
    },
  });
};

startEmailConsumer();
