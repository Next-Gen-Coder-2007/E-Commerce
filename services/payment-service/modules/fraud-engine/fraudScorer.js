/**
 * Real-Time Transaction Fraud & Risk Scoring Engine
 * Evaluates orders against velocity spikes, amount anomalies,
 * card decline patterns, and billing/shipping geographic discrepancies.
 */

export const RISK_THRESHOLDS = {
  LOW: 30,
  HIGH: 70,
};

export const RISK_DECISIONS = {
  APPROVE: 'APPROVE',
  REVIEW: 'REVIEW',
  REJECT: 'REJECT',
};

// Known disposable / suspicious email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'trashmail.com',
]);

export class FraudRiskScorer {
  /**
   * Evaluates order transaction metadata and computes a composite risk score (0-100)
   * @param {Object} transactionData Transaction context
   * @returns {Object} Comprehensive risk evaluation
   */
  static evaluateTransaction(transactionData = {}) {
    const {
      amount = 0,
      currency = 'USD',
      userId = '',
      email = '',
      shippingAddress = {},
      billingAddress = {},
      paymentMethod = 'card',
      cardNumber = '',
      recentDeclinesCount = 0,
      ordersInLastHour = 0,
      isFirstTimeBuyer = false,
    } = transactionData;

    let riskScore = 0;
    const riskFactors = [];

    // 1. Transaction Amount Anomaly
    const numAmount = Number(amount);
    if (numAmount > 5000) {
      riskScore += 40;
      riskFactors.push({ code: 'VERY_HIGH_AMOUNT', weight: 40, description: `Transaction amount ($${numAmount}) exceeds $5,000 threshold` });
    } else if (numAmount > 2000) {
      riskScore += 25;
      riskFactors.push({ code: 'HIGH_AMOUNT', weight: 25, description: `Transaction amount ($${numAmount}) exceeds $2,000 threshold` });
    } else if (numAmount > 1000) {
      riskScore += 10;
      riskFactors.push({ code: 'ELEVATED_AMOUNT', weight: 10, description: `Transaction amount ($${numAmount}) is above average` });
    }

    // 2. Order Velocity Spike
    if (ordersInLastHour >= 5) {
      riskScore += 45;
      riskFactors.push({ code: 'VELOCITY_BURST', weight: 45, description: `${ordersInLastHour} orders placed in the last hour` });
    } else if (ordersInLastHour >= 3) {
      riskScore += 25;
      riskFactors.push({ code: 'ELEVATED_VELOCITY', weight: 25, description: `${ordersInLastHour} orders placed in the last hour` });
    }

    // 3. Card Decline History
    if (recentDeclinesCount >= 3) {
      riskScore += 35;
      riskFactors.push({ code: 'REPEATED_CARD_DECLINES', weight: 35, description: `${recentDeclinesCount} recent failed card attempts recorded` });
    } else if (recentDeclinesCount > 0) {
      riskScore += 15;
      riskFactors.push({ code: 'RECENT_CARD_DECLINE', weight: 15, description: 'Previous failed payment attempt on file' });
    }

    // 4. Geographic & Address Mismatch
    const shipCountry = (shippingAddress.country || '').trim().toLowerCase();
    const billCountry = (billingAddress.country || shippingAddress.country || '').trim().toLowerCase();
    const shipPostal = (shippingAddress.postalCode || '').trim();
    const billPostal = (billingAddress.postalCode || shippingAddress.postalCode || '').trim();

    if (shipCountry && billCountry && shipCountry !== billCountry) {
      riskScore += 30;
      riskFactors.push({ code: 'COUNTRY_MISMATCH', weight: 30, description: `Shipping country (${shipCountry}) differs from billing country (${billCountry})` });
    }

    // 5. Disposable / Suspicious Email Domain
    if (email && email.includes('@')) {
      const domain = email.split('@')[1].toLowerCase();
      if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
        riskScore += 30;
        riskFactors.push({ code: 'DISPOSABLE_EMAIL', weight: 30, description: `Disposable temporary email domain detected (@${domain})` });
      }
    }

    // 6. Test Decline Card
    if (cardNumber.endsWith('0000')) {
      riskScore += 50;
      riskFactors.push({ code: 'SIMULATED_DECLINE_CARD', weight: 50, description: 'Test card configured for simulated rejection' });
    }

    // Clamp score between 0 and 100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Determine Risk Level & Decision
    let riskLevel = 'LOW';
    let decision = RISK_DECISIONS.APPROVE;

    if (riskScore >= RISK_THRESHOLDS.HIGH) {
      riskLevel = 'HIGH';
      decision = RISK_DECISIONS.REJECT;
    } else if (riskScore >= RISK_THRESHOLDS.LOW) {
      riskLevel = 'MEDIUM';
      decision = RISK_DECISIONS.REVIEW;
    }

    return {
      riskScore,
      riskLevel,
      decision,
      isApproved: decision === RISK_DECISIONS.APPROVE,
      riskFactors,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

export default FraudRiskScorer;
