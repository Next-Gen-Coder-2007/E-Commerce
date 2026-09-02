import { createProducer, TOPICS, EVENT_TYPES } from '../../shared/kafka/index.js';

const catalogProducer = createProducer('product-service');

export const publishCatalogPriceChanged = async (data, options = {}) => {
  return catalogProducer.publishEvent(
    TOPICS.CATALOG_EVENTS,
    EVENT_TYPES.CATALOG_PRICE_CHANGED,
    {
      productId: data.productId?.toString(),
      title: data.title,
      previousPrice: data.previousPrice,
      newPrice: data.newPrice,
      discountPct: data.discountPct,
      companyId: data.companyId?.toString(),
      updatedAt: new Date().toISOString(),
    },
    {
      key: data.productId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishCatalogProductUpdated = async (product, options = {}) => {
  return catalogProducer.publishEvent(
    TOPICS.CATALOG_EVENTS,
    EVENT_TYPES.CATALOG_PRODUCT_UPDATED,
    {
      productId: product._id?.toString() || product.id,
      title: product.title,
      price: product.price,
      category: product.category,
      brand: product.brand,
      companyId: product.companyId?.toString(),
      updatedAt: new Date().toISOString(),
    },
    {
      key: product._id?.toString() || product.id,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishCatalogStockReplenished = async (data, options = {}) => {
  return catalogProducer.publishEvent(
    TOPICS.CATALOG_EVENTS,
    EVENT_TYPES.CATALOG_STOCK_REPLENISHED,
    {
      productId: data.productId?.toString(),
      addedQuantity: data.addedQuantity,
      newTotalStock: data.newTotalStock,
      replenishedAt: new Date().toISOString(),
    },
    {
      key: data.productId?.toString(),
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export const publishCatalogFlashSaleStarted = async (saleData, options = {}) => {
  return catalogProducer.publishEvent(
    TOPICS.CATALOG_EVENTS,
    EVENT_TYPES.CATALOG_FLASH_SALE_STARTED,
    {
      campaignId: saleData.campaignId,
      title: saleData.title,
      discountPercentage: saleData.discountPercentage,
      productIds: saleData.productIds,
      expiresAt: saleData.expiresAt,
    },
    {
      key: saleData.campaignId,
      correlationId: options.correlationId,
      traceId: options.traceId,
    }
  );
};

export default catalogProducer;
