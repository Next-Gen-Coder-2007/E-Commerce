import EventEmitter from 'events';

class LocalEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  async publish(topic, event) {
    // Topic-level broadcast and specific event-type broadcast
    this.emit(topic, event);
    if (event.eventType) {
      this.emit(`${topic}:${event.eventType}`, event);
    }
    return true;
  }
}

const localEventBus = new LocalEventBus();
export default localEventBus;
