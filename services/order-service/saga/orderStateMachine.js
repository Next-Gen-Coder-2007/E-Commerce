export const ORDER_STATES = Object.freeze({
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
});

// Backward-compatible lowercase mappings
export const normalizeState = (state = '') => {
  const upper = String(state).toUpperCase().trim();
  switch (upper) {
    case 'PLACED':
    case 'PENDING':
      return ORDER_STATES.PENDING;
    case 'CONFIRMED':
    case 'PAID':
      return ORDER_STATES.CONFIRMED;
    case 'PROCESSING':
      return ORDER_STATES.PROCESSING;
    case 'SHIPPED':
      return ORDER_STATES.SHIPPED;
    case 'DELIVERED':
      return ORDER_STATES.DELIVERED;
    case 'CANCELLED':
    case 'CANCELED':
      return ORDER_STATES.CANCELLED;
    case 'REFUNDED':
      return ORDER_STATES.REFUNDED;
    default:
      return upper;
  }
};

export const ALLOWED_TRANSITIONS = Object.freeze({
  [ORDER_STATES.CREATED]: [ORDER_STATES.PENDING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PENDING]: [ORDER_STATES.CONFIRMED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.CONFIRMED]: [ORDER_STATES.PROCESSING, ORDER_STATES.CANCELLED],
  [ORDER_STATES.PROCESSING]: [ORDER_STATES.SHIPPED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.SHIPPED]: [ORDER_STATES.DELIVERED, ORDER_STATES.CANCELLED],
  [ORDER_STATES.DELIVERED]: [ORDER_STATES.REFUNDED],
  [ORDER_STATES.CANCELLED]: [ORDER_STATES.REFUNDED],
  [ORDER_STATES.REFUNDED]: [],
});

export class IllegalStateTransitionError extends Error {
  constructor(currentState, targetState, orderId = '') {
    super(
      `Illegal order state transition from '${currentState}' to '${targetState}'${
        orderId ? ` on order ${orderId}` : ''
      }`
    );
    this.name = 'IllegalStateTransitionError';
    this.currentState = currentState;
    this.targetState = targetState;
    this.orderId = orderId;
    this.statusCode = 400;
  }
}

/**
 * Validates whether transitioning from currentState to targetState is permitted
 * @param {string} currentState
 * @param {string} targetState
 * @param {string} orderId
 * @returns {boolean}
 */
export const isValidTransition = (currentState, targetState) => {
  const normCurrent = normalizeState(currentState);
  const normTarget = normalizeState(targetState);
  if (normCurrent === normTarget) return true;
  return (ALLOWED_TRANSITIONS[normCurrent] || []).includes(normTarget);
};

export const validateStateTransition = (currentState, targetState, orderId = '') => {
  const normCurrent = normalizeState(currentState);
  const normTarget = normalizeState(targetState);

  if (normCurrent === normTarget) {
    return true; // Idempotent no-op
  }

  const allowed = ALLOWED_TRANSITIONS[normCurrent] || [];
  if (!allowed.includes(normTarget)) {
    throw new IllegalStateTransitionError(normCurrent, normTarget, orderId);
  }

  return true;
};

/**
 * Applies transition and returns updated timeline entry
 */
export const transitionOrder = (order, targetState, details = {}) => {
  const normTarget = normalizeState(targetState);
  validateStateTransition(order.orderStatus, normTarget, order._id || order.id);

  const previousState = order.orderStatus;
  order.orderStatus = normTarget;

  const timelineEntry = {
    status: normTarget.toLowerCase(),
    title: details.title || `Order transitioned to ${normTarget}`,
    description: details.description || `Status changed from ${previousState} to ${normTarget}`,
    timestamp: new Date(),
    updatedBy: details.updatedBy || 'system',
  };

  order.timeline = order.timeline || [];
  order.timeline.push(timelineEntry);

  if (Array.isArray(order.statusHistory)) {
    order.statusHistory.push({
      status: normTarget.toLowerCase(),
      timestamp: new Date(),
      note: details.description || `State change to ${normTarget}`,
      updatedBy: details.updatedBy || 'system',
    });
  }

  return timelineEntry;
};
