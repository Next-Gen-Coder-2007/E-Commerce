import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Minus, Trash2, Check, Star, ShoppingBag, ArrowUpRight } from 'lucide-react';
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
    <article
      onClick={handleCardClick}
      className={`group relative bg-[#FFFFFF] border border-[#1E1E1E]/20 hover:border-[#1E1E1E] transition-all duration-300 flex flex-col justify-between cursor-pointer font-satoshi select-none ${className}`}
      style={{ transitionDelay: `${(index % 4) * 35}ms` }}
    >
      <div>
        {/* Top Product Image Showcase: Strict 3:4 Aspect Ratio */}
        <div className="relative w-full aspect-[3/4] bg-[#E4E2DD]/40 overflow-hidden flex items-center justify-center p-6 border-b border-[#1E1E1E]/15">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] select-none"
            loading="lazy"
          />

          {/* Badges on Top-Left: Raw Brutalist Cutouts */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
            {hasDiscount && discountPercent > 0 && (
              <span className="px-2 py-0.5 bg-[#DB4A2B] text-[#FFFFFF] text-[10px] font-mono font-bold uppercase tracking-wider">
                -{discountPercent}%
              </span>
            )}
            {product.subcategory ? (
              <span className="px-2 py-0.5 bg-[#1E1E1E] text-[#E4E2DD] text-[9px] font-mono font-semibold uppercase tracking-widest">
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
            className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              inWish
                ? 'bg-[#1E1E1E] text-[#FF89A9] shadow-sm'
                : 'bg-[#FFFFFF]/90 hover:bg-[#1E1E1E] text-[#1E1E1E] hover:text-[#FFFFFF] border border-[#1E1E1E]/20'
            }`}
            title={inWish ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-[#FF89A9] text-[#FF89A9]' : ''}`} />
          </button>

          {/* Subtle Hover Reveal: Arrow */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="w-7 h-7 bg-[#1E1E1E] text-[#FFFFFF] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Product Information Body */}
        <div className="p-4 space-y-2 text-left">
          {/* Brand & Stock Row */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider">
            <span className="text-[#444444] font-bold truncate max-w-[140px]">
              {brandOrMerchant}
            </span>
            {product.stock <= 5 && product.stock > 0 ? (
              <span className="text-[#DB4A2B] font-bold">
                ONLY {product.stock} LEFT
              </span>
            ) : product.stock > 0 ? (
              <span className="text-[#1E1E1E] font-medium">IN STOCK</span>
            ) : (
              <span className="text-[#DB4A2B] font-bold">SOLD OUT</span>
            )}
          </div>

          {/* Title: Transitions to Soft Pink on Hover */}
          <h3 className="font-clash text-sm font-bold uppercase tracking-tight text-[#1E1E1E] line-clamp-2 leading-snug group-hover:text-[#FF89A9] transition-colors duration-200">
            {product.title}
          </h3>

          {/* Ratings or Attribute Options Tag */}
          <div className="flex items-center gap-2 text-xs text-[#444444]">
            {(product.numReviews || 0) > 0 ? (
              <div className="flex items-center gap-1 font-mono text-[10px]">
                <Star className="w-3 h-3 fill-[#F8A348] text-[#F8A348]" />
                <span className="font-bold text-[#1E1E1E]">{product.rating}</span>
                <span className="text-[#444444]">({product.numReviews})</span>
              </div>
            ) : product.attributes && Object.keys(product.attributes).length > 0 ? (
              <span className="text-[10px] text-[#444444] font-mono uppercase">
                {Object.keys(product.attributes).slice(0, 2).join(' / ')}
              </span>
            ) : (
              <span className="text-[10px] text-[#444444] font-mono uppercase">
                VERIFIED DROP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price & Cart Action Footer */}
      <div className="p-4 pt-3 border-t border-[#1E1E1E]/15 flex items-center justify-between bg-[#E4E2DD]/20">
        <div className="flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-clash font-bold text-[#1E1E1E] tracking-tight">
            ${product.price % 1 === 0 ? product.price.toFixed(0) : product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#444444] line-through font-mono">
              ${product.originalPrice!.toFixed(0)}
            </span>
          )}
        </div>

        {/* Cart Action */}
        <div onClick={(e) => e.stopPropagation()}>
          {cartItem ? (
            <div className="inline-flex items-center bg-[#1E1E1E] text-[#E4E2DD] p-0.5">
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
                className="w-6 h-6 flex items-center justify-center text-[#E4E2DD] hover:bg-[#FFFFFF] hover:text-[#DB4A2B] transition-colors cursor-pointer"
                title="Decrease"
              >
                {cartItem.quantity === 1 ? (
                  <Trash2 className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </button>
              <span className="px-2 text-xs font-mono font-bold text-[#E4E2DD] min-w-[20px] text-center">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                disabled={cartItem.quantity >= product.stock}
                onClick={async (e) => {
                  e.stopPropagation();
                  await updateQuantity(product._id, cartItem.quantity + 1);
                }}
                className="w-6 h-6 flex items-center justify-center text-[#E4E2DD] hover:bg-[#FFFFFF] hover:text-[#DB4A2B] disabled:opacity-20 transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#DB4A2B] text-[#E4E2DD] text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Add to Cart"
            >
              {adding ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ADDED</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ADD</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
