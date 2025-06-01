const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'bigbasket-clone',
  brokers: ['localhost:9092'], // change to your container IP if needed
});

module.exports = kafka;
