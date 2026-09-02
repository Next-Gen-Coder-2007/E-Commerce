import express from 'express';
import {
  getForYouRecommendations,
  getFrequentlyBoughtTogether,
  executeSemanticHybridSearch,
} from './recommendationController.js';

const router = express.Router();

router.get('/for-you', getForYouRecommendations);
router.get('/frequently-bought-together/:productId', getFrequentlyBoughtTogether);
router.get('/semantic-hybrid', executeSemanticHybridSearch);

export default router;
