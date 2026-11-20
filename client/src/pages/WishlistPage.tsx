import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { wishlistService, WishlistItem, WishlistResponse } from '../services/wishlistService';
import { Heart, Trash2, ShoppingBag, Share2, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RawAtmosphere } from '../components/RawAtmosphere';
import { BrutalistButton } from '../components/BrutalistButton';

export const WishlistPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken?: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const {
    wishlist: myWishlist,
    removeFromWishlist,
    moveToCartAndNotify,
    refreshWishlist,
  } = useWishlist();

  const isSharedView = Boolean(shareToken);
  const [sharedWishlist, setSharedWishlist] = useState<WishlistResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  useEffect(() => {
    if (isSharedView && shareToken) {
      wishlistService
        .getSharedWishlist(shareToken)
        .then((res) => {
          setSharedWishlist(res);
        })
        .catch((err) => {
          console.warn('Failed to load shared wishlist:', err);
        });
    }
  }, [isSharedView, shareToken]);

  const activeWishlist = isSharedView ? sharedWishlist : myWishlist;
  const items: WishlistItem[] = activeWishlist?.items || [];

  const categories: string[] = ['all', ...Array.from(new Set(items.map((i: WishlistItem) => i.category || 'general')))];

  const filteredItems: WishlistItem[] =
    selectedCategory === 'all'
      ? items
      : items.filter((i: WishlistItem) => (i.category || 'general').toLowerCase() === selectedCategory.toLowerCase());

  const priceDropItems = items.filter((i: WishlistItem) => i.isPriceDropped);

  const handleToggleShare = async () => {
    if (!myWishlist) return;
    try {
      setIsPublicLoading(true);
      await wishlistService.togglePublicShare(!myWishlist.isPublic);
      await refreshWishlist();
    } catch (err) {
      console.error('Failed to update share settings:', err);
    } finally {
      setIsPublicLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!myWishlist?.shareToken) return;
    const url = `${window.location.origin}/wishlist/shared/${myWishlist.shareToken}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleMoveAllToCart = () => {
    items.forEach((item: WishlistItem) => {
      addToCart({
        productId: item.productId,
        title: item.title,
        price: item.currentPrice || item.priceAtAdd,
        image: item.image || '',
        quantity: 1,
        category: item.category || 'general',
        stock: 99,
      });
    });
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-10 font-satoshi text-[#1E1E1E] relative">
      <RawAtmosphere variant="subtle" />

      {/* Header Banner */}
      <div className="p-8 sm:p-12 bg-[#FFFFFF] border-2 border-[#1E1E1E] space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1E1E1E] text-[#FF89A9] text-[10px] font-mono font-bold uppercase tracking-widest">
              <Heart className="w-3.5 h-3.5" />
              <span>{isSharedView ? 'PUBLIC GIFT REGISTRY ARCHIVE' : 'PERSONAL CURATION RADAR'}</span>
            </div>
            <h1 className="font-clash text-4xl sm:text-6xl font-bold uppercase tracking-[-0.05em] text-[#1E1E1E] leading-none">
              {isSharedView ? 'SHARED REGISTRY' : 'SAVED ARCHIVE'}
            </h1>
            <p className="text-xs sm:text-sm text-[#444444] leading-relaxed">
              {isSharedView
                ? 'Curated merchandise selected by an affiliate collector. Add items directly to your dispatch manifest.'
                : 'Monitor real-time inventory levels, configure price drop alarms, and archive seasonal silhouettes.'}
            </p>
          </div>

          {/* Action Buttons */}
          {!isSharedView && myWishlist && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleToggleShare}
                disabled={isPublicLoading}
                className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer border ${
                  myWishlist.isPublic
                    ? 'bg-[#1E1E1E] text-[#E4E2DD] border-[#1E1E1E]'
                    : 'bg-[#FFFFFF] text-[#1E1E1E] border-[#1E1E1E]/30 hover:border-[#1E1E1E]'
                }`}
              >
                {myWishlist.isPublic ? 'REGISTRY: PUBLIC' : 'REGISTRY: PRIVATE'}
              </button>

              {myWishlist.isPublic && myWishlist.shareToken && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-[#FFFFFF] border-2 border-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-[#E4E2DD] text-[#1E1E1E] text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  <span>{isCopied ? 'URL COPIED' : 'COPY REGISTRY URL'}</span>
                </button>
              )}

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleMoveAllToCart}
                  className="raw-btn px-6 py-2.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest cursor-pointer"
                >
                  DISPATCH ALL TO BAG
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Metrics Bar */}
        <div className="pt-6 border-t border-[#1E1E1E]/20 grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-[#E4E2DD]/40 border border-[#1E1E1E]/15">
            <span className="text-[10px] text-[#444444] uppercase tracking-widest font-bold">SAVED PIECES</span>
            <p className="font-clash text-2xl font-bold text-[#1E1E1E] mt-1">{items.length} SILHOUETTES</p>
          </div>
          <div className="p-4 bg-[#E4E2DD]/40 border border-[#1E1E1E]/15">
            <span className="text-[10px] text-[#DB4A2B] uppercase tracking-widest font-bold">PRICE DROPS</span>
            <p className="font-clash text-2xl font-bold text-[#DB4A2B] mt-1">{priceDropItems.length} MARKDOWNS</p>
          </div>
          <div className="p-4 bg-[#E4E2DD]/40 border border-[#1E1E1E]/15 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#444444] uppercase tracking-widest font-bold">DEPARTMENTS</span>
            <p className="font-clash text-2xl font-bold text-[#1E1E1E] mt-1">{categories.length - 1} CATEGORIES</p>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 font-mono text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 font-bold uppercase tracking-wider transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1E1E1E] text-[#E4E2DD]'
                  : 'bg-[#FFFFFF] border border-[#1E1E1E]/20 text-[#1E1E1E] hover:border-[#1E1E1E]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Wishlist Items Grid (3 Columns on Desktop) */}
      <div className="space-y-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-[#FFFFFF] border-2 border-[#1E1E1E] p-8 space-y-4">
            <Heart className="w-12 h-12 text-[#FF89A9] mx-auto" />
            <h3 className="font-clash text-xl font-bold uppercase tracking-tight text-[#1E1E1E]">
              NO ARCHIVED ITEMS DETECTED
            </h3>
            <p className="text-xs text-[#444444] max-w-sm mx-auto">
              Browse the catalog and press the heart icon on any product to save it to your curation registry.
            </p>
            <Link
              to="/"
              className="inline-block raw-btn px-8 py-3.5 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-widest"
            >
              BROWSE CATALOG
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <article
                key={item.productId}
                className="bg-[#FFFFFF] border-2 border-[#1E1E1E] flex flex-col justify-between group"
              >
                <div>
                  {/* Image showcase: 3:4 aspect */}
                  <div className="relative aspect-[3/4] bg-[#E4E2DD]/40 border-b border-[#1E1E1E]/20 p-6 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'}
                      alt={item.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {item.isPriceDropped && (
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-[#DB4A2B] text-[#FFFFFF] font-mono text-[9px] font-bold uppercase tracking-widest">
                        PRICE DROP -{item.discountPct}%
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(item.productId)}
                      className="absolute top-3 right-3 p-1.5 bg-[#FFFFFF] border border-[#1E1E1E]/30 hover:border-[#DB4A2B] hover:text-[#DB4A2B] text-[#1E1E1E] transition cursor-pointer"
                      title="Remove from archive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#444444] uppercase">
                      <span>{item.category || 'COMMERCE'}</span>
                      <span className="text-[#1E1E1E] font-bold">{item.companyName || 'VERIFIED ORIGIN'}</span>
                    </div>

                    <Link to={`/product/${item.productId}`}>
                      <h3 className="font-clash text-sm font-bold uppercase tracking-tight text-[#1E1E1E] hover:text-[#DB4A2B] transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 pt-1 font-mono">
                      <span className="text-base font-bold text-[#1E1E1E]">
                        ${Number(item.currentPrice || item.priceAtAdd || 0).toFixed(2)}
                      </span>
                      {item.isPriceDropped && (
                        <span className="text-xs text-[#444444] line-through">
                          ${Number(item.priceAtAdd).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => moveToCartAndNotify(item.productId)}
                    className="w-full raw-btn py-3 px-4 bg-[#1E1E1E] text-[#E4E2DD] border border-[#1E1E1E] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>TRANSFER TO SHOPPING BAG</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
