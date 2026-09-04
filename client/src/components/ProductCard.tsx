import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Minus, Trash2, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  index = 0,
  className = '',
}) => {
  const navigate = useNavigate();
  const { items, addToCart, removeFromCart, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [adding, setAdding] = useState(false);

  const cartItem = items.find((i) => i.productId === product._id);
  const inWish = isInWishlist(product._id);

  // Compute clean subtitle
  const getSubtitle = () => {
    const editionSpec = product.specifications?.find(
      (s) => s.key.toLowerCase().includes('edition') || s.key.toLowerCase().includes('version') || s.key.toLowerCase().includes('storage')
    );
    if (editionSpec) return editionSpec.value;

    const colorSpec = product.specifications?.find((s) => s.key.toLowerCase().includes('color'));
    if (colorSpec) return colorSpec.value;

    if (product.brand && product.companyName && product.brand !== product.companyName) {
      return product.brand;
    }

    if (product.category === 'fashion') {
      return 'Premium Cotton & Tailored Fit';
    }
    if (product.category === 'electronics') {
      return 'High-Fidelity Audio & Tech';
    }
    if (product.category === 'home') {
      return 'Minimalist Living & Studio Design';
    }

    return product.companyName || 'Verified Authentic';
  };

  const isFashion =
    product.category?.toLowerCase() === 'fashion' ||
    product.category?.toLowerCase() === 'clothing' ||
    product.category?.toLowerCase() === 'apparel';

  const isAudioOrElectronics =
    product.category?.toLowerCase() === 'electronics' ||
    product.category?.toLowerCase() === 'tech' ||
    product.category?.toLowerCase() === 'audio';

  // Curated minimalist color swatches for monochrome aesthetic matching reference
  const colorSwatches = isFashion
    ? ['#ffffff', '#0a0a0a', '#737373']
    : isAudioOrElectronics
    ? ['#ffffff', '#171717']
    : null;

  const sizes = isFashion ? ['S', 'M', 'L', 'XL'] : null;

  const handleCardClick = () => {
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(
        {
          productId: product._id,
          title: product.title,
          price: product.price,
          image: product.image,
          category: product.category,
          companyId: product.companyId,
          companyName: product.companyName,
          stock: product.stock,
          quantity: 1,
        },
        false
      );
    } finally {
      setTimeout(() => setAdding(false), 400);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative bg-white rounded-3xl p-6 md:p-7 flex flex-col items-center justify-between text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] border border-neutral-100 ${className}`}
      style={{ transitionDelay: `${(index % 4) * 50}ms` }}
    >
      {/* Discreet Wishlist Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
        }}
        className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
          inWish
            ? 'bg-neutral-900 text-white shadow-xs scale-105'
            : 'text-neutral-300 hover:text-neutral-900 hover:bg-neutral-100'
        }`}
        title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart className={`w-4 h-4 ${inWish ? 'fill-white text-white' : ''}`} />
      </button>

      {/* Top Header: Title & Clean Subtitle */}
      <div className="w-full px-2">
        <h3 className="font-bold text-slate-900 text-base md:text-lg tracking-tight line-clamp-1 group-hover:text-slate-700 transition-colors">
          {product.title}
        </h3>
        <p className="text-xs md:text-sm font-normal text-slate-400 mt-1 tracking-normal line-clamp-1">
          {getSubtitle()}
        </p>
      </div>

      {/* Center Section: Focused Product Image with generous whitespace */}
      <div className="w-full h-44 sm:h-48 md:h-52 my-5 flex items-center justify-center relative overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="max-h-full max-w-[85%] object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none"
          loading="lazy"
        />
      </div>

      {/* Bottom Section: Variants / Feature indicator & Price */}
      <div className="w-full flex flex-col items-center">
        {/* Variant / Tag Row (Color swatches, sizes, or Free shipping) */}
        <div className="min-h-[38px] flex flex-col items-center justify-center gap-1.5 mb-2">
          {/* Color Dots */}
          {colorSwatches ? (
            <div className="flex items-center justify-center gap-2">
              {colorSwatches.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(idx);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    selectedColor === idx
                      ? 'scale-110 ring-2 ring-slate-400 ring-offset-1 border-slate-300'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color option ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}

          {/* Size Pills (if fashion) */}
          {sizes ? (
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
              {sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(sz);
                  }}
                  className={`w-5 h-5 flex items-center justify-center rounded-full transition-all ${
                    selectedSize === sz
                      ? 'border border-slate-300 font-bold text-slate-900 shadow-2xs'
                      : 'hover:text-slate-700'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          ) : !colorSwatches || isAudioOrElectronics ? (
            /* Free Shipping Indicator (pure neutral minimalism) */
            <span className="text-[12px] font-medium text-neutral-500 tracking-normal">
              Free shipping
            </span>
          ) : null}
        </div>

        {/* Price & Smooth Quick Cart Control */}
        <div className="w-full flex items-center justify-center relative pt-1">
          {/* Default Price View */}
          <div className="flex items-baseline justify-center gap-1.5">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-neutral-400 line-through font-normal">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
            <span className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
              ${product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
            </span>
          </div>

          {/* Subtle Quick Cart Add / Counter on Hover or Active */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            {cartItem ? (
              <div className="inline-flex items-center rounded-full bg-neutral-900 text-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (cartItem.quantity <= 1) {
                      await removeFromCart(product._id);
                    } else {
                      await updateQuantity(product._id, cartItem.quantity - 1);
                    }
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {cartItem.quantity === 1 ? (
                    <Trash2 className="w-2.5 h-2.5 text-neutral-300" />
                  ) : (
                    <Minus className="w-2.5 h-2.5" />
                  )}
                </button>
                <span className="px-1.5 text-[11px] font-bold text-white min-w-[16px] text-center">
                  {cartItem.quantity}
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await updateQuantity(product._id, cartItem.quantity + 1);
                  }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer"
                title="Add to cart"
              >
                {adding ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
