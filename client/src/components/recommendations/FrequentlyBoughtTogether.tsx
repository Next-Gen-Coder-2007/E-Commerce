import React, { useEffect, useState } from 'react';
import { Plus, Check, ShoppingBag, Sparkles, Tag } from 'lucide-react';
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
    // Add main product
    await addToCart({
      productId: bundleData.mainProduct._id,
      title: bundleData.mainProduct.title,
      price: bundleData.mainProduct.price,
      image: bundleData.mainProduct.image,
      quantity: 1,
    });
    // Add selected bundle items
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
    <div className="my-10 bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <Sparkles className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-lg font-black text-zinc-950">Frequently Bought Together</h3>
          <p className="text-xs text-zinc-500">
            Combine complementary essentials and unlock an automatic{' '}
            <b className="text-emerald-600">{bundleData.bundleDiscountPct}% bundle discount</b>
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Product Visual Combo Strip */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Product Card */}
          <div className="flex items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl max-w-xs">
            <img
              src={bundleData.mainProduct.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
              alt={bundleData.mainProduct.title}
              className="w-14 h-14 rounded-xl object-cover bg-zinc-100"
            />
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Current Item</span>
              <div className="text-xs font-bold text-zinc-900 line-clamp-1">
                {bundleData.mainProduct.title}
              </div>
              <div className="text-xs font-mono font-black text-zinc-950">
                ${bundleData.mainProduct.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Plus separator and Bundle items */}
          {bundleData.bundleItems.map((item) => {
            const isSelected = selectedItemIds.includes(item._id);
            return (
              <React.Fragment key={item._id}>
                <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center font-bold text-xs">
                  <Plus className="w-3.5 h-3.5" />
                </div>

                <div
                  onClick={() => toggleItem(item._id)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl max-w-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-50 border border-zinc-900 ring-1 ring-zinc-900 shadow-2xs'
                      : 'bg-white border border-zinc-200 opacity-60'
                  }`}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80'}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover bg-zinc-100"
                  />
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Add-on</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-bold text-zinc-900 line-clamp-1">{item.title}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-zinc-950">
                        ${item.bundleDiscountPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] line-through text-zinc-400 font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Pricing Summary & Checkout Button */}
        <div className="w-full lg:w-72 bg-zinc-50 border border-zinc-200 rounded-3xl p-5 flex flex-col justify-between shrink-0 space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-zinc-500">
              <span>Combined Total:</span>
              <span className="font-mono text-zinc-400 line-through">
                ${calculatedRawPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-900 font-bold">
              <span>Bundle Price:</span>
              <span className="font-mono text-base font-black text-zinc-950">
                ${calculatedBundlePrice.toFixed(2)}
              </span>
            </div>
            {calculatedSavings > 0 && (
              <div className="flex items-center justify-between text-emerald-600 font-semibold text-[11px]">
                <span className="inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Instant Bundle Savings:</span>
                </span>
                <span className="font-mono font-bold">-${calculatedSavings.toFixed(2)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            disabled={selectedBundleItems.length === 0}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              addedToCartSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white active:scale-95'
            }`}
          >
            {addedToCartSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Bundle Added to Cart!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add {selectedBundleItems.length + 1} Items to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrequentlyBoughtTogether;
