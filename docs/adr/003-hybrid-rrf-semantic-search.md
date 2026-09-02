# ADR 003: AI Semantic Vector Search & Reciprocal Rank Fusion (RRF)

## Status
**Accepted** (Implemented in `product-service` recommendation and search modules)

## Context
Standard keyword text search (BM25 / lexical regex) struggles with conceptual queries, typos, and natural language shopping intent (e.g. *"lightweight developer laptop with great battery"*). Conversely, pure vector similarity search often lacks precision on exact model identifiers, SKUs, and brand names (e.g. *"M3 Max 36GB"*).

## Decision
We implemented **Hybrid Search with Reciprocal Rank Fusion (RRF)**:
1. **64-Dimensional Dense Vector Embeddings**:
   - Normalized float vector embeddings generated for product titles, brands, categories, descriptions, and tags.
2. **Reciprocal Rank Fusion**:
   - Merges lexical search rankings with dense vector cosine similarity rankings using the standard constant $k=60$:
     $$RRF\_Score(d) = \sum_{m \in \{\text{lexical}, \text{vector}\}} \frac{1}{60 + r_m(d)}$$
3. **Multi-Signal Personalization Scoring**:
   - Purchases: `5.0`, Cart items: `4.5`, Wishlist items: `4.0` (strong intent indicator), Category views: `1.5`.

## Consequences
### Positive:
- **Best of Both Worlds**: Pinpoint precision on exact brand/SKU queries combined with semantic understanding of natural language descriptions.
- **Personalized Discovery**: Dynamic `"For You"` and `"Frequently Bought Together"` widgets grounded in actual user behavior.
