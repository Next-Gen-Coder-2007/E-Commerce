import crypto from 'crypto';
import { transitionOrder, ORDER_STATES } from './orderStateMachine.js';
import inventoryClient from '../clients/inventoryClient.js';
import paymentClient from '../clients/paymentClient.js';
import OutboxEvent from '../../shared/outbox/OutboxEvent.js';
import OutboxPublisher from '../../shared/outbox/outboxPublisher.js';
import { TOPICS, EVENT_TYPES } from '../../shared/kafka/topics.js';

export class CheckoutSaga {
  constructor(order, options = {}) {
    this.sagaId = `saga_${crypto.randomBytes(8).toString('hex')}`;
    this.order = order;
    this.options = {
      correlationId: options.correlationId || `corr_${crypto.randomBytes(8).toString('hex')}`,
      traceId: options.traceId || `tr_${crypto.randomBytes(12).toString('hex')}`,
      idempotencyKey: options.idempotencyKey || `pay_${order._id?.toString() || order.id}_${Date.now()}`,
      paymentMethod: options.paymentMethod || order.paymentInfo?.method || 'mock_instant',
      paymentDetails: options.paymentDetails || {},
      ...options,
    };

    this.reservationId = null;
    this.transactionId = null;
    this.state = 'INITIALIZED';
    this.auditSteps = [];
  }

  logStep(stepName, status, details = {}) {
    this.auditSteps.push({
      step: stepName,
      status,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  /**
   * Main saga execution coordinator
   */
  async execute() {
    this.state = 'IN_PROGRESS';
    this.logStep('START_SAGA', 'STARTED', { sagaId: this.sagaId, orderId: this.order._id });

    // -------------------------------------------------------------
    // STEP 1: Persist initial order & Queue Outbox ORDER_CREATED
    // -------------------------------------------------------------
    try {
      this.order.orderStatus = ORDER_STATES.PENDING;
      this.order.sagaContext = {
        sagaId: this.sagaId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };

      await this.order.save();

      // Dual-write prevention: queue event atomically in Outbox
      await OutboxPublisher.queueEvent(OutboxEvent, {
        aggregateType: 'Order',
        aggregateId: this.order._id,
        eventType: EVENT_TYPES.ORDER_CREATED,
        topic: TOPICS.ORDER_EVENTS,
        partitionKey: this.order._id?.toString(),
        payload: {
          orderId: this.order._id?.toString(),
          orderNumber: this.order.orderNumber,
          userId: this.order.userId?.toString(),
          totalAmount: this.order.pricing?.totalPrice || this.order.totalAmount,
          items: this.order.orderItems,
        },
        correlationId: this.options.correlationId,
        traceId: this.options.traceId,
        sourceService: 'order-service',
      });

      this.logStep('STEP_1_CREATE_ORDER', 'COMPLETED', { orderNumber: this.order.orderNumber });
    } catch (err) {
      this.state = 'FAILED';
      this.logStep('STEP_1_CREATE_ORDER', 'FAILED', { error: err.message });
      throw err;
    }

    // -------------------------------------------------------------
    // STEP 2: Reserve Warehouse Inventory (Two-Phase Hold)
    // -------------------------------------------------------------
    this.logStep('STEP_2_RESERVE_INVENTORY', 'PENDING');
    const reserveItems = (this.order.orderItems || []).map((item) => ({
      productId: item.productId || item._id,
      quantity: item.quantity,
    }));

    const reserveRes = await inventoryClient.reserveStock({
      orderId: this.order._id?.toString(),
      items: reserveItems,
      ttlSeconds: 900,
      correlationId: this.options.correlationId,
      traceId: this.options.traceId,
    });

    if (!reserveRes.ok || !reserveRes.data?.success) {
      this.state = 'FAILED';
      const failureReason = reserveRes.data?.message || 'Insufficient stock for items in order';
      this.logStep('STEP_2_RESERVE_INVENTORY', 'FAILED', { reason: failureReason });

      // Compensating action: Cancel order immediately
      await this._compensateOrder(failureReason, 'INSUFFICIENT_STOCK');

      return {
        success: false,
        sagaId: this.sagaId,
        step: 'RESERVE_INVENTORY',
        code: 'INSUFFICIENT_STOCK',
        message: failureReason,
        order: this.order,
        auditSteps: this.auditSteps,
      };
    }

    this.reservationId = reserveRes.data.data?.reservationId;
    this.logStep('STEP_2_RESERVE_INVENTORY', 'COMPLETED', { reservationId: this.reservationId });

    // -------------------------------------------------------------
    // STEP 3: Process Financial Transaction
    // -------------------------------------------------------------
    this.logStep('STEP_3_PROCESS_PAYMENT', 'PENDING');
    const totalAmount = this.order.pricing?.totalPrice || this.order.totalAmount || 0;

    const paymentRes = await paymentClient.chargePayment({
      orderId: this.order._id?.toString(),
      amount: totalAmount,
      currency: this.order.currency || 'USD',
      paymentMethod: this.options.paymentMethod,
      paymentDetails: this.options.paymentDetails,
      userId: this.order.userId?.toString(),
      idempotencyKey: this.options.idempotencyKey,
      correlationId: this.options.correlationId,
      traceId: this.options.traceId,
    });

    if (!paymentRes.ok || !paymentRes.data?.success) {
      const declineReason = paymentRes.data?.message || 'Payment charge declined';
      this.state = 'COMPENSATING';
      this.logStep('STEP_3_PROCESS_PAYMENT', 'FAILED', { reason: declineReason });

      // ⚡ COMPENSATING ACTION 1: Release reserved inventory
      this.logStep('COMPENSATE_RELEASE_INVENTORY', 'PENDING', { reservationId: this.reservationId });
      await inventoryClient.releaseReservation({
        orderId: this.order._id?.toString(),
        reservationId: this.reservationId,
        items: reserveItems,
        reason: `Saga compensation: payment failed (${declineReason})`,
        correlationId: this.options.correlationId,
        traceId: this.options.traceId,
      });
      this.logStep('COMPENSATE_RELEASE_INVENTORY', 'COMPLETED');

      // ⚡ COMPENSATING ACTION 2: Cancel Order
      await this._compensateOrder(declineReason, 'PAYMENT_FAILED');

      this.state = 'COMPENSATED';
      return {
        success: false,
        sagaId: this.sagaId,
        step: 'PROCESS_PAYMENT',
        code: 'PAYMENT_FAILED',
        message: declineReason,
        order: this.order,
        auditSteps: this.auditSteps,
      };
    }

    this.transactionId = paymentRes.data.data?.transactionId;
    this.logStep('STEP_3_PROCESS_PAYMENT', 'COMPLETED', { transactionId: this.transactionId });

    // -------------------------------------------------------------
    // STEP 4: Permanently Commit Inventory Allocation
    // -------------------------------------------------------------
    this.logStep('STEP_4_COMMIT_INVENTORY', 'PENDING');
    await inventoryClient.commitReservation({
      orderId: this.order._id?.toString(),
      reservationId: this.reservationId,
      items: reserveItems,
      correlationId: this.options.correlationId,
      traceId: this.options.traceId,
    });
    this.logStep('STEP_4_COMMIT_INVENTORY', 'COMPLETED');

    // -------------------------------------------------------------
    // STEP 5: Confirm Order & Queue Outbox ORDER_CONFIRMED
    // -------------------------------------------------------------
    this.logStep('STEP_5_CONFIRM_ORDER', 'PENDING');
    transitionOrder(this.order, ORDER_STATES.CONFIRMED, {
      title: 'Order Confirmed',
      description: `Payment verified (${this.transactionId}) & stock allocated`,
      updatedBy: 'saga-coordinator',
    });

    if (this.order.paymentInfo) {
      this.order.paymentInfo.status = 'paid';
      this.order.paymentInfo.transactionId = this.transactionId;
      this.order.paymentInfo.paidAt = new Date();
    }

    this.order.sagaContext = {
      sagaId: this.sagaId,
      status: 'COMPLETED',
      reservationId: this.reservationId,
      transactionId: this.transactionId,
      completedAt: new Date(),
    };

    await this.order.save();

    // Dual-write prevention: queue ORDER_CONFIRMED in Outbox
    await OutboxPublisher.queueEvent(OutboxEvent, {
      aggregateType: 'Order',
      aggregateId: this.order._id,
      eventType: EVENT_TYPES.ORDER_CONFIRMED,
      topic: TOPICS.ORDER_EVENTS,
      partitionKey: this.order._id?.toString(),
      payload: {
        orderId: this.order._id?.toString(),
        orderNumber: this.order.orderNumber,
        userId: this.order.userId?.toString(),
        totalAmount,
        transactionId: this.transactionId,
      },
      correlationId: this.options.correlationId,
      traceId: this.options.traceId,
      sourceService: 'order-service',
    });

    this.state = 'COMPLETED';
    this.logStep('STEP_5_CONFIRM_ORDER', 'COMPLETED', { orderStatus: 'CONFIRMED' });

    return {
      success: true,
      sagaId: this.sagaId,
      status: 'COMPLETED',
      order: this.order,
      reservationId: this.reservationId,
      transactionId: this.transactionId,
      auditSteps: this.auditSteps,
    };
  }

  async _compensateOrder(reason, errorCode) {
    try {
      transitionOrder(this.order, ORDER_STATES.CANCELLED, {
        title: 'Order Cancelled',
        description: `Cancelled during checkout saga: ${reason}`,
        updatedBy: 'saga-compensation',
      });

      if (this.order.paymentInfo) {
        this.order.paymentInfo.status = 'failed';
      }

      this.order.sagaContext = {
        sagaId: this.sagaId,
        status: 'FAILED',
        errorCode,
        failureReason: reason,
        failedAt: new Date(),
      };

      await this.order.save();

      // Queue ORDER_CANCELLED in Outbox
      await OutboxPublisher.queueEvent(OutboxEvent, {
        aggregateType: 'Order',
        aggregateId: this.order._id,
        eventType: EVENT_TYPES.ORDER_CANCELLED,
        topic: TOPICS.ORDER_EVENTS,
        partitionKey: this.order._id?.toString(),
        payload: {
          orderId: this.order._id?.toString(),
          orderNumber: this.order.orderNumber,
          userId: this.order.userId?.toString(),
          reason,
          errorCode,
        },
        correlationId: this.options.correlationId,
        traceId: this.options.traceId,
        sourceService: 'order-service',
      });
    } catch (compErr) {
      console.error(`[Checkout Saga] Error executing order compensation:`, compErr.message);
    }
  }
}

export const executeCheckoutSaga = async (order, options = {}) => {
  const saga = new CheckoutSaga(order, options);
  return saga.execute();
};

export default CheckoutSaga;
