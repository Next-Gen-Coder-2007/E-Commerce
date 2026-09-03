# ADR 007: AI Conversational Shopping Assistant & Multi-Factor Fraud Risk Engine

## Status
**Accepted** (Implemented in `product-service` AI modules, `payment-service` fraud controller, and React client drawer)

## Context
Modern marketplace users expect intuitive conversational product discovery without needing to manually apply complex filter combinations. Simultaneously, high-velocity card-not-present fraud and coupon abuse represent substantial financial risks for multi-vendor platforms.

## Decision
We implemented **Conversational Natural Language Shopping Intelligence and Real-Time Fraud Scoring**:
1. **AI Shopping Assistant (`<AiShoppingAssistantDrawer />`)**:
   - Natural language constraint extraction parsing price bounds (e.g. *"under $150"*), categories, keywords, specs, and brand preferences from conversational prompts.
   - Grounded product retrieval returning structured, interactive product cards with live stock, ratings, and 1-click cart addition.
   - Contextual conversation history retention for multi-turn clarifications.
2. **Multi-Factor Fraud Risk Engine (`/api/payments/fraud/evaluate`)**:
   - Evaluates a composite risk score ($0 \le \text{Score} \le 100$) based on weighted behavioral heuristics:
     - **Velocity Burst Scoring**: Frequency of transactions within rolling 1-hour and 24-hour windows.
     - **Order Value Anomaly**: Deviation from normal customer purchasing patterns.
     - **Geolocation Discrepancy**: Billing vs. shipping country mismatches.
     - **Card Attempt Frequency**: Rapid successive failed payment attempts.
   - Actionable Tri-State Decision Output:
     - **`APPROVE`** ($\text{Score} < 40$): Low risk, standard frictionless authorization.
     - **`REVIEW`** ($40 \le \text{Score} \le 75$): Moderate risk, flagged for merchant audit or secondary verification.
     - **`REJECT`** ($\text{Score} > 75$): High risk, blocked with immediate fraud event emission.

## Consequences
### Positive:
- **Enhanced Customer Conversion**: AI concierge reduces time-to-discovery and assists shoppers with guided product discovery.
- **Zero Chargeback Leaks**: High-risk fraudulent transactions are halted before settlement, protecting merchant revenue and chargeback ratios.

### Tradeoffs:
- Risk heuristics thresholds must be tuned periodically based on false positive vs. false negative business tolerance.
