import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Minus, Trash2, Check, Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types/product';
import { getTaxonomyCategory } from '../config/taxonomy';

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

  const [adding, setAdding] = useState(false);

  const cartItem = items.find((i) => i.productId === product._id);
  const inWish = isInWishlist(product._id);

  // Compute canonical department & subcategory name
  const taxCat = getTaxonomyCategory(product.category);
  const categoryLabel = taxCat ? taxCat.name : product.category;
  const brandOrMerchant = product.brand || product.companyName || categoryLabel;

  const hasDiscount = Boolean(
    product.originalPrice && product.originalPrice > product.price
  );
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

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
      className={`group relative bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between p-3 sm:p-4 cursor-pointer ${className}`}
      style={{ transitionDelay: `${(index % 4) * 40}ms` }}
    >
      <div>
        {/* Top Product Image Showcase */}
        <div className="relative w-full aspect-square bg-zinc-50/80 rounded-xl overflow-hidden p-4 flex items-center justify-center border border-zinc-100">
          <img
            src={product.image}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-106 transition-transform duration-500 drop-shadow-2xs select-none"
            loading="lazy"
          />

          {/* Badges on Top-Left: Discount or Subcategory */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
            {hasDiscount && discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold tracking-tight shadow-2xs">
                -{discountPercent}%
              </span>
            )}
            {product.subcategory ? (
              <span className="px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-zinc-700 text-[10px] font-semibold border border-zinc-200/80 shadow-2xs">
                {product.subcategory}
              </span>
            ) : null}
          </div>

          {/* Wishlist Button on Top-Right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              inWish
                ? 'bg-zinc-950 text-white shadow-xs scale-105'
                : 'bg-white/90 backdrop-blur-xs text-zinc-400 hover:text-zinc-950 hover:bg-white border border-zinc-200/80 shadow-2xs'
            }`}
            title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-white text-white' : ''}`} />
          </button>
        </div>

        {/* Product Information Body */}
        <div className="pt-3.5 space-y-1.5 text-left">
          {/* Brand & Stock Row */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider truncate max-w-[140px]">
              {brandOrMerchant}
            </span>
            {product.stock <= 5 && product.stock > 0 ? (
              <span className="text-amber-600 font-bold text-[10px] bg-amber-50 px-1.5 py-0.5 rounded">
                Only {product.stock} left
              </span>
            ) : product.stock > 0 ? (
              <span className="text-emerald-600 font-semibold text-[10px]">In Stock</span>
            ) : (
              <span className="text-rose-600 font-semibold text-[10px]">Out of Stock</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {product.title}
          </h3>

          {/* Ratings or Attribute Options Tag */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-0.5">
            {(product.numReviews || 0) > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold text-zinc-900 text-[11px]">{product.rating}</span>
                <span className="text-zinc-400 text-[10px]">({product.numReviews})</span>
              </div>
            ) : product.attributes && Object.keys(product.attributes).length > 0 ? (
              <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 px-2 py-0.5 rounded-md">
                {Object.keys(product.attributes).slice(0, 2).join(' • ')} Options
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 font-medium">Verified Merchant</span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Cart Action Footer */}
      <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-base sm:text-lg font-black text-zinc-950 font-sans tracking-tight">
            ${product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-zinc-400 line-through font-normal">
              ${product.originalPrice!.toFixed(0)}
            </span>
          )}
        </div>

        {/* Cart Action */}
        <div onClick={(e) => e.stopPropagation()}>
          {cartItem ? (
            <div className="inline-flex items-center rounded-xl bg-zinc-950 text-white p-0.5 shadow-2xs">
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
                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Decrease"
              >
                {cartItem.quantity === 1 ? (
                  <Trash2 className="w-3 h-3 text-zinc-300" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </button>
              <span className="px-1.5 text-xs font-bold text-white min-w-[18px] text-center font-mono">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                disabled={cartItem.quantity >= product.stock}
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateQuantity(product._id, cartItem.quantity + 1);
                }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
                title="Increase"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Add to cart"
            >
              {adding ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
