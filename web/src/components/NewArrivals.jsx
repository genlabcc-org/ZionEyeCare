import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { productService } from '../services/productService';
import { getColorStyle } from '../utils/colorUtils';
import { Skeleton } from './ui/Skeleton';
import './NewArrivals.css';

const DEFAULT_COLOR_PALETTES = [
  [
    { name: 'Havana Tortoise', bg: 'linear-gradient(135deg, #78350f 0%, #3e1f0d 50%, #170d07 100%)' },
    { name: 'Classic Black', bg: '#18181b' },
    { name: 'Oxblood Red', bg: '#7f1d1d' },
    { name: 'Amber Gold', bg: '#b45309' },
  ],
  [
    { name: 'Crystal Clear', bg: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)' },
    { name: 'Midnight Navy', bg: '#1e293b' },
    { name: 'Steel Blue', bg: '#475569' },
  ],
  [
    { name: 'Forest Green', bg: '#166534' },
    { name: 'Matte Black', bg: '#18181b' },
    { name: 'Deep Indigo', bg: '#1e1b4b' },
  ],
  [
    { name: 'Ocean Navy', bg: '#1e3a8a' },
    { name: 'Onyx Black', bg: '#18181b' },
    { name: 'Sage Olive', bg: '#365314' },
  ],
];

export default function NewArrivals({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState({});
  const [activeColors, setActiveColors] = useState({});
  const [activeImages, setActiveImages] = useState({});
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const checkScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(overflow);
    setCanScrollRight(overflow);
  };

  useEffect(() => {
    checkScroll();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    const timer = setTimeout(checkScroll, 250);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [products, loading]);

  const handleSlide = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.querySelector('.new-arrival-card') || el.firstElementChild;
    const scrollAmount = card ? card.offsetWidth + 20 : el.clientWidth * 0.75;

    if (direction === 'right') {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 10) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Auto-slide on desktop (width > 768px)
  useEffect(() => {
    if (loading || !hasOverflow || isPaused) return;

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) return;
      handleSlide('right');
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, hasOverflow, isPaused]);

  useEffect(() => {
    let isMounted = true;
    const fetchNewArrivals = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            product_id,
            name,
            price,
            compare_price,
            discount_price,
            images,
            image_url,
            has_variants,
            is_featured,
            colors,
            product_variants(variant_id, price, compare_price, stock, images, color, color_code),
            categories(name, slug)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) {
          console.error('Error fetching new arrivals:', error);
          if (isMounted) {
            setProducts([]);
            setLoading(false);
          }
          return;
        }

        const mapped = (data || []).map((p, pIdx) => {
          const variants = p.product_variants || [];
          const hasVariants = !!p.has_variants && variants.length > 0;

          const firstVariantImage = hasVariants
            ? variants.find((v) => v.images?.length > 0)?.images?.[0]
            : null;

          const img =
            firstVariantImage ||
            (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image_url || ''));

          // Extract colors defined by admin on product or its variants
          const rawColors = [];
          if (Array.isArray(p.colors)) {
            rawColors.push(...p.colors);
          } else if (typeof p.colors === 'string' && p.colors.trim()) {
            try {
              const parsed = JSON.parse(p.colors);
              if (Array.isArray(parsed)) rawColors.push(...parsed);
              else rawColors.push(p.colors);
            } catch {
              rawColors.push(...p.colors.split(','));
            }
          }

          if (Array.isArray(variants)) {
            variants.forEach((v) => {
              if (v?.color) rawColors.push(v.color);
            });
          }

          const seen = new Set();
          const extractedColors = [];
          rawColors.forEach((c) => {
            const val = String(c || '').trim();
            if (val && !seen.has(val.toLowerCase())) {
              seen.add(val.toLowerCase());
              const matchedVar = variants.find(
                (v) => v.color && v.color.toLowerCase() === val.toLowerCase()
              );
              extractedColors.push({
                name: val,
                bg: matchedVar?.color_code || getColorStyle(val),
                image: matchedVar?.images?.[0] || null,
              });
            }
          });

          const fallback = DEFAULT_COLOR_PALETTES[pIdx % DEFAULT_COLOR_PALETTES.length];
          const finalColors = extractedColors.length > 0 ? extractedColors : fallback;

          return {
            id: p.product_id,
            productId: p.product_id,
            product_id: p.product_id,
            name: p.name,
            img,
            images: p.images || [],
            colors: finalColors,
            has_variants: hasVariants,
            rawProduct: p,
          };
        });

        if (isMounted) {
          setProducts(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load new arrivals:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchNewArrivals();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleWishlistToggle = (e, productId) => {
    e.stopPropagation();
    setWishlist((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleSwatchClick = (e, productId, swatchIndex, swatch) => {
    e.stopPropagation();
    setActiveColors((prev) => ({
      ...prev,
      [productId]: swatchIndex,
    }));
    if (swatch?.image) {
      setActiveImages((prev) => ({
        ...prev,
        [productId]: swatch.image,
      }));
    }
  };

  return (
    <section className="new-arrivals-section" aria-label="New Arrivals">
      <div className="new-arrivals-header-row">
        <div className="new-arrivals-header-left">
          <h2 className="new-arrivals-title">NEW ARRIVALS</h2>
          <p className="new-arrivals-subtitle">Check what's new in our stock</p>
        </div>
      </div>

      {loading ? (
        <div className="new-arrivals-slider-wrap">
          <div className="new-arrivals-grid new-arrivals-slider" ref={sliderRef}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="new-arrival-skeleton-item">
                <Skeleton width="100%" height="310px" borderRadius="16px" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                  <Skeleton width="50%" height="18px" borderRadius="4px" />
                  <Skeleton width="32%" height="16px" borderRadius="4px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="new-arrivals-empty">
          <p>No new products found. Check back soon!</p>
        </div>
      ) : (
        <div
          className="new-arrivals-slider-wrap"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {canScrollLeft && hasOverflow && (
            <button
              type="button"
              className="new-arrivals-nav-btn new-arrivals-nav-prev"
              onClick={() => handleSlide('left')}
              aria-label="Previous products"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <div
            className={`new-arrivals-grid new-arrivals-slider ${hasOverflow ? 'has-overflow' : 'is-centered'} ${products.length === 1 ? 'single-item' : ''}`}
            ref={sliderRef}
          >
            {products.map((product) => {
              const currentImage = activeImages[product.id] || product.img;
              const activeSwatchIdx = activeColors[product.id] ?? 0;
              const swatches = product.colors || [];
              const visibleSwatches = swatches.slice(0, 3);
              const remainingCount = swatches.length - 3;
              const isWishlisted = !!wishlist[product.id];

              return (
                <article
                  key={product.id}
                  className="new-arrival-card"
                  onClick={() => onProductClick && onProductClick(product.rawProduct || product)}
                >
                  <div className="new-arrival-img-box">
                    {/* Top-Left Diagonal Corner Ribbon */}
                    <div className="new-arrival-corner-ribbon" aria-hidden="true">
                      NEW
                    </div>

                    {/* Top-Right Wishlist Heart Button */}
                    <button
                      type="button"
                      className={`new-arrival-wishlist-btn ${isWishlisted ? 'is-active' : ''}`}
                      onClick={(e) => handleWishlistToggle(e, product.id)}
                      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isWishlisted ? '#ef4444' : 'none'}
                        stroke={isWishlisted ? '#ef4444' : '#1f2937'}
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>

                    {/* Centered Eyewear Product Image */}
                    <img
                      src={productService.getResizedImageUrl(currentImage, 'card')}
                      alt={product.name}
                      className="new-arrival-img"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = product.img || '/src/assets/home/eye1.jpg';
                      }}
                    />

                    {/* Bottom-Right 3D Rotation Badge */}
                    <div className="new-arrival-3d-badge" title="3D Interactive View" aria-label="3D View">
                      <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text
                          x="14"
                          y="13"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="700"
                          fill="#1f2937"
                          fontFamily="'Outfit', 'Inter', sans-serif"
                        >
                          3D
                        </text>
                        <path
                          d="M7.5 17.5C9.2 19.8 12 21 14.8 20.8C18.2 20.4 21 18 21.8 14.8"
                          stroke="#1f2937"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6 14.8L7.4 18.2L10.8 17.2"
                          stroke="#1f2937"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Details Bar: Product Name (Left) & Swatches (Right) */}
                  <div className="new-arrival-info">
                    <h3 className="new-arrival-name" title={product.name}>
                      {product.name}
                    </h3>

                    {swatches.length > 0 && (
                      <div className="new-arrival-swatches" aria-label="Available frame colors">
                        {visibleSwatches.map((swatch, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className={`new-arrival-swatch-item ${activeSwatchIdx === sIdx ? 'is-selected' : ''}`}
                            style={{ background: swatch.bg }}
                            onClick={(e) => handleSwatchClick(e, product.id, sIdx, swatch)}
                            title={swatch.name}
                            aria-label={swatch.name}
                          />
                        ))}
                        {remainingCount > 0 && (
                          <span className="new-arrival-swatch-more">
                            +{remainingCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {canScrollRight && hasOverflow && (
            <button
              type="button"
              className="new-arrivals-nav-btn new-arrivals-nav-next"
              onClick={() => handleSlide('right')}
              aria-label="Next products"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
