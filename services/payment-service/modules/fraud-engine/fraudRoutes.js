import express from 'express';
import FraudRiskScorer from './fraudScorer.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

const router = express.Router();

/**
 * @desc Real-Time Transaction Risk & Fraud Evaluation
 * @route POST /api/payments/fraud/evaluate
 * @access Internal / Private
 */
router.post('/evaluate', (req, res) => {
  try {
    const evaluation = FraudRiskScorer.evaluateTransaction(req.body);

    return sendSuccess(res, {
      statusCode: 200,
      data: evaluation,
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      code: 'FRAUD_EVAL_ERROR',
      message: error.message,
    });
  }
});

export default router;
