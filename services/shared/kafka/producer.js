import crypto from 'crypto';
import createKafkaClient from './kafkaClient.js';
import localEventBus from './eventBus.js';
import { TOPICS, DLQ_TOPICS } from './topics.js';

class ResilientProducer {
  constructor(serviceName = 'service') {
    this.serviceName = serviceName;
    this.kafka = createKafkaClient(serviceName);
    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
    this.isConnected = false;
    this.isConnecting = false;
    this.disabled = process.env.KAFKA_ENABLED !== 'true';
  }

  async connect() {
    if (this.disabled) {
      return;
    }

    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.isConnecting = false;
      console.log(`[Kafka Producer:${this.serviceName}] Connected to Kafka broker cluster successfully`);
    } catch (error) {
      this.isConnected = false;
      this.isConnecting = false;
      console.warn(
        `[Kafka Producer:${this.serviceName}] Broker unavailable (${error.message}). Falling back to in-memory event bus.`
      );
    }
  }

  /**
   * Publish an event to a Kafka topic or fallback event bus
   * @param {string} topic - Target topic (e.g. TOPICS.ORDER_EVENTS)
   * @param {string} eventType - Type name (e.g. EVENT_TYPES.ORDER_CREATED)
   * @param {object} payload - Domain event data
   * @param {object} options - Partition key, correlationId, traceId, etc.
   */
  async publishEvent(topic, eventType, payload = {}, options = {}) {
    const eventId = options.eventId || `evt_${crypto.randomBytes(8).toString('hex')}`;
    const correlationId = options.correlationId || `corr_${crypto.randomBytes(8).toString('hex')}`;
    const traceId = options.traceId || `tr_${crypto.randomBytes(12).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const partitionKey = options.key || payload.orderId || payload.userId || payload.productId || payload.id || null;

    const eventEnvelope = {
      eventId,
      eventType,
      sourceService: this.serviceName,
      timestamp,
      correlationId,
      traceId,
      schemaVersion: options.schemaVersion || '1.0.0',
      data: payload,
    };

    // Always notify local in-memory event bus for in-process or local listeners
    localEventBus.publish(topic, eventEnvelope);

    if (this.disabled) {
      return { success: true, mode: 'local-event-bus', eventId };
    }

    if (!this.isConnected && !this.isConnecting) {
      await this.connect();
    }

    if (!this.isConnected) {
      return { success: true, mode: 'local-fallback', eventId };
    }

    try {
      const record = {
        topic,
        messages: [
          {
            key: partitionKey ? String(partitionKey) : undefined,
            value: JSON.stringify(eventEnvelope),
            headers: {
              eventType: String(eventType),
              sourceService: String(this.serviceName),
              correlationId: String(correlationId),
              traceId: String(traceId),
              timestamp: String(timestamp),
            },
          },
        ],
      };

      const result = await this.producer.send(record);
      return {
        success: true,
        mode: 'kafka',
        eventId,
        partition: result?.[0]?.partition,
        offset: result?.[0]?.baseOffset,
      };
    } catch (sendError) {
      console.error(
        `[Kafka Producer:${this.serviceName}] Failed to send event ${eventType} to ${topic}:`,
        sendError.message
      );

      // Attempt DLQ write if not already publishing to DLQ
      await this.publishToDLQ(topic, eventEnvelope, sendError);

      return {
        success: false,
        mode: 'error-dlq',
        eventId,
        error: sendError.message,
      };
    }
  }

  async publishToDLQ(originalTopic, eventEnvelope, error) {
    if (originalTopic.endsWith('.dlq') || originalTopic === TOPICS.DEAD_LETTER_QUEUE) {
      return;
    }
    const dlqTopic = DLQ_TOPICS[originalTopic] || TOPICS.DEAD_LETTER_QUEUE;
    try {
      if (this.isConnected) {
        await this.producer.send({
          topic: dlqTopic,
          messages: [
            {
              key: eventEnvelope.eventId,
              value: JSON.stringify({
                originalTopic,
                failedEvent: eventEnvelope,
                error: { message: error.message, stack: error.stack },
                dlqTimestamp: new Date().toISOString(),
              }),
            },
          ],
        });
        console.warn(`[Kafka Producer:${this.serviceName}] Routed failed event ${eventEnvelope.eventId} to DLQ: ${dlqTopic}`);
      }
    } catch (dlqErr) {
      console.error(`[Kafka Producer:${this.serviceName}] Failed to publish to DLQ:`, dlqErr.message);
    }
  }

  async disconnect() {
    if (this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        console.log(`[Kafka Producer:${this.serviceName}] Disconnected cleanly`);
      } catch (err) {
        console.warn(`[Kafka Producer:${this.serviceName}] Disconnect warning:`, err.message);
      }
    }
  }
}

export const createProducer = (serviceName) => new ResilientProducer(serviceName);
export default ResilientProducer;
