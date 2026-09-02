import express from 'express';
import FacetedSearchEngine from './searchEngine.js';
import { sendSuccess, sendError } from '../../utils/responseEnvelope.js';

const router = express.Router();

/**
 * @route GET /api/products/search/faceted
 * @desc Multi-attribute faceted search with dynamic aggregation buckets
 */
router.get('/faceted', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const result = await FacetedSearchEngine.search(req.query);
    const latencyMs = Date.now() - startTime;

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        ...result,
        searchTelemetry: {
          latencyMs,
          engine: 'faceted-ngram',
          cached: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/products/search/autocomplete
 * @desc Sub-15ms edge n-gram search-as-you-type autocomplete with typo-tolerance
 */
router.get('/autocomplete', async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { q = '', limit = 6 } = req.query;

    const result = await FacetedSearchEngine.autocomplete(q, limit);
    const latencyMs = Date.now() - startTime;

    return sendSuccess(res, {
      statusCode: 200,
      data: {
        ...result,
        searchTelemetry: {
          latencyMs,
          engine: 'edge-autocomplete-v1',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
