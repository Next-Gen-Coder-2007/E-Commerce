import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

const parseBrokers = () => {
  const envBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
  return envBrokers
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
};

const getKafkaLogLevel = () => {
  switch (process.env.KAFKA_LOG_LEVEL?.toLowerCase()) {
    case 'error':
      return logLevel.ERROR;
    case 'warn':
      return logLevel.WARN;
    case 'info':
      return logLevel.INFO;
    case 'debug':
      return logLevel.DEBUG;
    case 'nothing':
    default:
      return logLevel.NOTHING;
  }
};

export const createKafkaClient = (serviceName = 'ecommerce-service') => {
  const clientId = process.env.KAFKA_CLIENT_ID || serviceName;
  const brokers = parseBrokers();

  const ssl = process.env.KAFKA_SSL === 'true';
  let sasl = undefined;

  if (process.env.KAFKA_SASL_USERNAME && process.env.KAFKA_SASL_PASSWORD) {
    sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
      username: process.env.KAFKA_SASL_USERNAME,
      password: process.env.KAFKA_SASL_PASSWORD,
    };
  }

  const isTest = process.env.NODE_ENV === 'test';
  const defaultRetries = isTest ? 1 : 2;
  const retries = process.env.KAFKA_RETRIES ? parseInt(process.env.KAFKA_RETRIES, 10) : defaultRetries;

  return new Kafka({
    clientId,
    brokers,
    ssl,
    sasl,
    logLevel: getKafkaLogLevel(),
    retry: {
      initialRetryTime: 100,
      retries,
      maxRetryTime: 1000,
      factor: 1.5,
    },
    connectionTimeout: 2000,
    requestTimeout: 10000,
  });
};

export default createKafkaClient;
