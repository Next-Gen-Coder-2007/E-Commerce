import React, { useEffect, useState } from 'react';
import { Plus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import {
  getFrequentlyBoughtTogetherApi,
  FrequentlyBoughtTogetherResponse,
} from '../../services/recommendationService';
import { useCart } from '../../context/CartContext';

interface Props {
  productId: string;
}

export const FrequentlyBoughtTogether: React.FC<Props> = ({ productId }) => {
  const [bundleData, setBundleData] = useState<FrequentlyBoughtTogetherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchBundle = async () => {
      setLoading(true);
      try {
        const res = await getFrequentlyBoughtTogetherApi(productId, 2);
        if (res.mainProduct && res.bundleItems && res.bundleItems.length > 0) {
          setBundleData(res);
          setSelectedItemIds(res.bundleItems.map((i) => i._id));
        }
      } catch (err) {
        console.error('Failed to load bundle recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchBundle();
  }, [productId]);

  if (loading || !bundleData || !bundleData.bundleItems || bundleData.bundleItems.length === 0) {
    return null;
  }

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedBundleItems = bundleData.bundleItems.filter((i) =>
    selectedItemIds.includes(i._id)
  );

  const calculatedBundlePrice =
    bundleData.mainProduct.price +
    selectedBundleItems.reduce((sum, item) => sum + item.bundleDiscountPrice, 0);

  const calculatedRawPrice =
    bundleData.mainProduct.price +
    selectedBundleItems.reduce((sum, item) => sum + item.price, 0);

  const calculatedSavings = calculatedRawPrice - calculatedBundlePrice;

  const handleAddBundleToCart = async () => {
    await addToCart({
      productId: bundleData.mainProduct._id,
      title: bundleData.mainProduct.title,
      price: bundleData.mainProduct.price,
      image: bundleData.mainProduct.image,
      quantity: 1,
    });
    for (const item of selectedBundleItems) {
      await addToCart({
        productId: item._id,
        title: item.title,
        price: item.bundleDiscountPrice || item.price,
        image: item.image,
        quantity: 1,
      });
    }
    setAddedToCartSuccess(true);
    setTimeout(() => setAddedToCartSuccess(false), 3000);
  };

  return (
    <div className="my-10 bg-[#FFFFFF] border-2 border-[#1E1E1E] p-6 sm:p-8 font-satoshi text-[#1E1E1E]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#1E1E1E]/15">
        <span className="w-8 h-8 bg-[#1E1E1E] text-[#DB4A2B] flex items-center justify-center">
          <Sparkles className="w-4 h-4" />
        </span>
        <div>
          <h3 className="font-clash text-lg font-bold uppercase tracking-tight text-[#1E1E1E]">
            COMPLEMENTARY ENSEMBLE
          </h3>
          <p className="text-xs text-[#444444] font-mono uppercase">
            COMBINE VERIFIED ACCESSORIES AND UNLOCK AN AUTOMATIC{' '}
            <span className="text-[#DB4A2B] font-bold">{bundleData.bundleDiscountPct}% BUNDLE MARKDOWN</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Product Visual Combo Strip */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Main Product Card */}
          <div className="flex items-center gap-3 p-3 bg-[#E4E2DD]/40 border border-[#1E1E1E]/20 flex-1 sm:flex-initial min-w-[200px]">
            <img
              src={bundleData.mainProduct.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
              alt={bundleData.mainProduct.title}
              className="w-14 h-16 object-contain bg-[#FFFFFF] border border-[#1E1E1E]/10"
            />
            <div className="min-w-0">
              <span className="text-[9px] font-mono font-bold text-[#444444] uppercase tracking-wider block">CURRENT ITEM</span>
              <div className="text-xs font-bold text-[#1E1E1E] uppercase truncate max-w-[140px]">
                {bundleData.mainProduct.title}
              </div>
              <div className="text-xs font-mono font-bold text-[#1E1E1E] mt-0.5">
                ${bundleData.mainProduct.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Plus separator and Bundle items */}
          {bundleData.bundleItems.map((item) => {
            const isSelected = selectedItemIds.includes(item._id);
            return (
              <React.Fragment key={item._id}>
                <div className="w-6 h-6 bg-[#1E1E1E] text-[#E4E2DD] flex items-center justify-center font-bold text-xs shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>

                <div
                  onClick={() => toggleItem(item._id)}
                  className={`flex items-center gap-3 p-3 border cursor-pointer transition-all flex-1 sm:flex-initial min-w-[200px] ${
                    isSelected
                      ? 'bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-xs'
                      : 'bg-[#E4E2DD]/20 border border-[#1E1E1E]/20 opacity-50'
                  }`}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                    alt={item.title}
                    className="w-14 h-16 object-contain bg-[#FFFFFF] border border-[#1E1E1E]/10"
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono font-bold text-[#DB4A2B] uppercase tracking-wider block">
                      +{bundleData.bundleDiscountPct}% OFF
                    </span>
                    <div className="text-xs font-bold text-[#1E1E1E] uppercase truncate max-w-[140px]">
                      {item.title}
                    </div>
                    <div className="flex items-baseline gap-1.5 font-mono text-xs mt-0.5">
                      <span className="font-bold text-[#1E1E1E]">${item.bundleDiscountPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-[#444444] line-through">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Action Panel */}
        <div className="w-full lg:w-72 p-4 bg-[#E4E2DD] border border-[#1E1E1E]/20 text-left space-y-3 font-mono shrink-0">
          <div className="space-y-1">
            <div className="text-[10px] uppercase text-[#444444] font-bold">TOTAL ENSEMBLE PRICE</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-clash font-bold text-[#1E1E1E]">
                ${calculatedBundlePrice.toFixed(2)}
              </span>
              {calculatedSavings > 0 && (
                <span className="text-xs text-[#DB4A2B] font-bold">
                  SAVE ${calculatedSavings.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            className="w-full raw-btn py-3 px-4 text-xs font-bold uppercase tracking-wider text-[#E4E2DD] bg-[#1E1E1E] border border-[#1E1E1E] hover:text-[#DB4A2B] flex items-center justify-center gap-2 cursor-pointer"
          >
            {addedToCartSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>ENSEMBLE ADDED</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>ADD {1 + selectedBundleItems.length} ITEMS TO BAG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
