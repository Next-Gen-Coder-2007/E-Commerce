import createKafkaClient from './kafkaClient.js';
import localEventBus from './eventBus.js';
import { TOPICS, DLQ_TOPICS } from './topics.js';

class ResilientConsumer {
  /**
   * @param {string} serviceName - Service identifier
   * @param {string} groupId - Consumer group ID
   * @param {Array<string>} topics - Topics to subscribe to
   */
  constructor(serviceName = 'service', groupId = null, topics = []) {
    this.serviceName = serviceName;
    this.groupId = groupId || `${serviceName}-consumer-group`;
    this.topics = topics;
    this.handlers = new Map(); // key: `${topic}:${eventType}` or `${topic}:*`
    this.kafka = createKafkaClient(serviceName);
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      allowAutoTopicCreation: true,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
    this.isConnected = false;
    this.isRunning = false;
    this.disabled = process.env.KAFKA_ENABLED !== 'true';
  }

  /**
   * Register an event handler for a topic and eventType
   * @param {string} topic - e.g. TOPICS.ORDER_EVENTS
   * @param {string|Array<string>} eventType - e.g. EVENT_TYPES.ORDER_CREATED or '*'
   * @param {Function} handler - async (eventEnvelope, context) => {}
   */
  on(topic, eventType, handler) {
    if (Array.isArray(eventType)) {
      for (const t of eventType) {
        this.handlers.set(`${topic}:${t}`, handler);
      }
    } else {
      this.handlers.set(`${topic}:${eventType}`, handler);
    }
    return this;
  }

  /**
   * Start listening to topics
   */
  async start() {
    // 1. Always setup local event bus subscription for fallback/in-memory mode
    for (const [key, handler] of this.handlers.entries()) {
      const [topic, eventType] = key.split(':');
      if (eventType === '*') {
        localEventBus.on(topic, async (envelope) => {
          try {
            await handler(envelope, { source: 'local-bus', topic });
          } catch (err) {
            console.error(`[Local EventBus:${this.serviceName}] Handler error on ${topic}:`, err.message);
          }
        });
      } else {
        localEventBus.on(`${topic}:${eventType}`, async (envelope) => {
          try {
            await handler(envelope, { source: 'local-bus', topic, eventType });
          } catch (err) {
            console.error(`[Local EventBus:${this.serviceName}] Handler error on ${topic}:${eventType}:`, err.message);
          }
        });
      }
    }

    if (this.disabled) {
      this.isRunning = true;
      return;
    }

    if (this.topics.length === 0) {
      console.warn(`[Kafka Consumer:${this.serviceName}] No topics specified for consumer group ${this.groupId}`);
      return;
    }

    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log(`[Kafka Consumer:${this.serviceName}] Connected as group: ${this.groupId}`);

      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        console.log(`[Kafka Consumer:${this.serviceName}] Subscribed to topic: ${topic}`);
      }

      await this.consumer.run({
        autoCommit: true,
        eachMessage: async ({ topic, partition, message }) => {
          await this._processMessage(topic, partition, message);
        },
      });

      this.isRunning = true;
    } catch (error) {
      this.isConnected = false;
      console.warn(
        `[Kafka Consumer:${this.serviceName}] Broker unavailable (${error.message}). Consumer operating on local event bus.`
      );
    }
  }

  async _processMessage(topic, partition, message) {
    let envelope;
    try {
      const rawValue = message.value?.toString('utf-8');
      if (!rawValue) return;
      envelope = JSON.parse(rawValue);
    } catch (parseErr) {
      console.error(`[Kafka Consumer:${this.serviceName}] Failed to parse message on ${topic}:`, parseErr.message);
      return;
    }

    const eventType = envelope.eventType || message.headers?.eventType?.toString();
    const handlerKeySpecific = `${topic}:${eventType}`;
    const handlerKeyWildcard = `${topic}:*`;

    const handler = this.handlers.get(handlerKeySpecific) || this.handlers.get(handlerKeyWildcard);

    if (!handler) {
      // No handler registered for this specific event type in this service
      return;
    }

    const context = {
      source: 'kafka',
      topic,
      partition,
      offset: message.offset,
      key: message.key?.toString('utf-8'),
      headers: message.headers,
    };

    try {
      await handler(envelope, context);
    } catch (handlerErr) {
      console.error(
        `[Kafka Consumer:${this.serviceName}] Error handling event ${eventType} (ID: ${envelope.eventId}) on ${topic}:`,
        handlerErr
      );
    }
  }

  async stop() {
    if (this.isConnected) {
      try {
        await this.consumer.disconnect();
        this.isConnected = false;
        this.isRunning = false;
        console.log(`[Kafka Consumer:${this.serviceName}] Disconnected cleanly`);
      } catch (err) {
        console.warn(`[Kafka Consumer:${this.serviceName}] Disconnect warning:`, err.message);
      }
    }
  }
}

export const createConsumer = (serviceName, groupId, topics) =>
  new ResilientConsumer(serviceName, groupId, topics);

export default ResilientConsumer;
