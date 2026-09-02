import { generateEmbedding, cosineSimilarity } from './vectorEmbeddings.js';

const RRF_K = 60; // Standard Rank constant for RRF

/**
 * Reciprocal Rank Fusion (RRF) Hybrid Search Engine
 * Combines BM25/Regex Lexical Search with Dense Vector Semantic Similarity
 */
export class HybridSearchEngine {
  /**
   * Performs hybrid ranking over a candidate product corpus
   * @param {string} query Search query string
   * @param {Array<Object>} candidates Candidate product list
   * @param {Object} options Configuration options
   * @returns {Array<Object>} Ranked products with hybrid scores
   */
  static rankHybrid(query = '', candidates = [], options = {}) {
    if (!candidates || candidates.length === 0) return [];
    if (!query || query.trim().length === 0) return candidates;

    const queryVector = generateEmbedding(query);
    const cleanQ = query.trim().toLowerCase();
    const queryTokens = cleanQ.split(/\s+/).filter(Boolean);

    // 1. Compute Lexical Rank (BM25 token match approximation)
    const lexicalScored = candidates.map((p) => {
      let lexicalScore = 0;
      const titleLower = (p.title || '').toLowerCase();
      const descLower = (p.description || '').toLowerCase();
      const brandLower = (p.brand || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();

      // Exact phrase bonus
      if (titleLower.includes(cleanQ)) lexicalScore += 10.0;
      if (brandLower === cleanQ) lexicalScore += 8.0;
      if (catLower === cleanQ) lexicalScore += 5.0;

      // Token overlap
      for (const token of queryTokens) {
        if (titleLower.includes(token)) lexicalScore += 3.0;
        if (brandLower.includes(token)) lexicalScore += 2.0;
        if (catLower.includes(token)) lexicalScore += 1.5;
        if (descLower.includes(token)) lexicalScore += 0.5;
      }

      return { product: p, lexicalScore };
    });

    lexicalScored.sort((a, b) => b.lexicalScore - a.lexicalScore);

    // 2. Compute Semantic Vector Rank (Cosine Similarity)
    const vectorScored = candidates.map((p) => {
      const productText = `${p.title || ''} ${p.brand || ''} ${p.category || ''} ${p.description || ''}`;
      const productVector = p.embedding && p.embedding.length === 64
        ? p.embedding
        : generateEmbedding(productText);

      const vectorScore = cosineSimilarity(queryVector, productVector);
      return { product: p, vectorScore };
    });

    vectorScored.sort((a, b) => b.vectorScore - a.vectorScore);

    // 3. Compute Reciprocal Rank Fusion (RRF) Scores
    const productRRFMap = new Map();

    lexicalScored.forEach((item, index) => {
      const rank = index + 1;
      const id = String(item.product._id || item.product.id);
      const rrfContribution = 1 / (RRF_K + rank);
      productRRFMap.set(id, {
        product: item.product,
        rrfScore: rrfContribution,
        lexicalRank: rank,
        lexicalScore: item.lexicalScore,
        vectorRank: 0,
        vectorScore: 0,
      });
    });

    vectorScored.forEach((item, index) => {
      const rank = index + 1;
      const id = String(item.product._id || item.product.id);
      const rrfContribution = 1 / (RRF_K + rank);

      if (productRRFMap.has(id)) {
        const existing = productRRFMap.get(id);
        existing.rrfScore += rrfContribution;
        existing.vectorRank = rank;
        existing.vectorScore = item.vectorScore;
      } else {
        productRRFMap.set(id, {
          product: item.product,
          rrfScore: rrfContribution,
          lexicalRank: 999,
          lexicalScore: 0,
          vectorRank: rank,
          vectorScore: item.vectorScore,
        });
      }
    });

    // 4. Sort results by total fused RRF score descending
    const fusedResults = Array.from(productRRFMap.values());
    fusedResults.sort((a, b) => b.rrfScore - a.rrfScore);

    return fusedResults.map((item) => ({
      ...item.product,
      hybridScore: Number(item.rrfScore.toFixed(6)),
      semanticRelevance: Number((item.vectorScore * 100).toFixed(1)),
      matchDetails: {
        lexicalRank: item.lexicalRank,
        vectorRank: item.vectorRank,
        vectorSimilarity: Number(item.vectorScore.toFixed(4)),
      },
    }));
  }
}

export default HybridSearchEngine;
