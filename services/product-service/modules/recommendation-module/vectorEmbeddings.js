/**
 * High-dimensional Semantic Vector Embeddings Engine
 * Uses deterministic subword n-gram hashing and term frequency weighting
 * to produce 64-dimensional normalized dense vectors.
 */

const VECTOR_DIMENSIONS = 64;

/**
 * Generates a normalized 64-dimensional float vector for text
 * @param {string} text 
 * @returns {number[]} Normalized 64-dim float vector
 */
export const generateEmbedding = (text = '') => {
  const vector = new Array(VECTOR_DIMENSIONS).fill(0);
  if (!text || typeof text !== 'string') return vector;

  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return vector;

  // 1. Accumulate word and subword hash weights
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Full word hash
    let h1 = hashString(word);
    const idx1 = Math.abs(h1) % VECTOR_DIMENSIONS;
    vector[idx1] += 1.5;

    // Subword char 3-grams
    if (word.length >= 3) {
      for (let j = 0; j <= word.length - 3; j++) {
        const trigram = word.substring(j, j + 3);
        const h2 = hashString(trigram);
        const idx2 = Math.abs(h2) % VECTOR_DIMENSIONS;
        vector[idx2] += 0.5;
      }
    }
  }

  // 2. L2 Normalization (Unit Length)
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
};

/**
 * Computes Cosine Similarity between two dense normalized vectors
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Value in [0, 1]
 */
export const cosineSimilarity = (vecA = [], vecB = []) => {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  const sim = dotProduct / denominator;
  return Math.max(0, Math.min(1, sim)); // clamp between 0 and 1
};

/**
 * Hash string to 32-bit integer
 */
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};
