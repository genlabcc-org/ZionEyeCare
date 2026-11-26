import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    const fetchNewArrivals = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            product_id,
            name,
            description,
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

          const cleanNum = (val) => {
            if (val == null || val === '') return null;
            const n = Number(String(val).replace(/[^0-9.]/g, ''));
            return !isNaN(n) && n >= 0 ? n : null;
          };

          const validPrices = variants
            .map((v) => cleanNum(v.price))
            .filter((n) => n != null && n > 0);
          const basePrice = validPrices.length > 0 ? Math.min(...validPrices) : (cleanNum(p.price) ?? 0);

          const validCompares = variants
            .map((v) => cleanNum(v.compare_price))
            .filter((n) => n != null && n > 0);
          const baseComparePrice = validCompares.length > 0 ? Math.max(...validCompares) : cleanNum(p.compare_price);

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
              const colorVariants = variants.filter(
                (v) => v.color && v.color.toLowerCase() === val.toLowerCase()
              );
              const cPrices = colorVariants.map((v) => cleanNum(v.price)).filter((n) => n != null && n > 0);
              const cCompares = colorVariants.map((v) => cleanNum(v.compare_price)).filter((n) => n != null && n > 0);
              const colorPrice = cPrices.length > 0 ? Math.min(...cPrices) : basePrice;
              const colorComparePrice = cCompares.length > 0 ? Math.max(...cCompares) : baseComparePrice;

              extractedColors.push({
                name: val,
                bg: matchedVar?.color_code || getColorStyle(val),
                image: matchedVar?.images?.[0] || null,
                price: colorPrice,
                compare_price: colorComparePrice,
              });
            }
          });

          const fallback = DEFAULT_COLOR_PALETTES[pIdx % DEFAULT_COLOR_PALETTES.length];
          const finalColors = extractedColors.length > 0 ? extractedColors : fallback;
          const normalizedProduct = productService.normalizeProductCare(p);

          return {
            id: p.product_id,
            productId: p.product_id,
            product_id: p.product_id,
            name: p.name,
            img,
            images: p.images || [],
            colors: finalColors,
            has_variants: hasVariants,
            price: basePrice,
            compare_price: baseComparePrice,
            fit: normalizedProduct?.fit || 'contain',
            imageFit: normalizedProduct?.fit || 'contain',
            rawProduct: normalizedProduct,
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
          <h2 className="new-arrivals-title">FEATURED</h2>
          <p className="new-arrivals-subtitle">Discover Our Finest</p>
        </div>
      </div>

      {loading ? (
        <div className="new-arrivals-grid-wrap">
          <div className="new-arrivals-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="new-arrival-skeleton-item">
                <Skeleton width="100%" height="280px" borderRadius="16px" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                  <Skeleton width="50%" height="18px" borderRadius="4px" />
                  <Skeleton width="32%" height="16px" borderRadius="4px" />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                  <Skeleton width="28%" height="16px" borderRadius="4px" />
                  <Skeleton width="20%" height="14px" borderRadius="4px" />
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
        <div className="new-arrivals-grid-wrap">
          <div className={`new-arrivals-grid ${products.length === 1 ? 'single-item' : ''}`}>
            {products.map((product) => {
              const currentImage = activeImages[product.id] || product.img;
              const activeSwatchIdx = activeColors[product.id] ?? 0;
              const swatches = product.colors || [];
              const visibleSwatches = swatches.slice(0, 4);
              const remainingCount = swatches.length - 4;
              const isWishlisted = !!wishlist[product.id];

              const selectedSwatch = swatches[activeSwatchIdx];
              const displayPrice =
                selectedSwatch?.price != null && !isNaN(selectedSwatch.price) && selectedSwatch.price > 0
                  ? selectedSwatch.price
                  : (product.price ?? 0);
              const displayComparePrice =
                selectedSwatch?.compare_price != null && !isNaN(selectedSwatch.compare_price) && selectedSwatch.compare_price > 0
                  ? selectedSwatch.compare_price
                  : (product.compare_price ?? null);

              const hasCutMrp = displayComparePrice != null && displayComparePrice > displayPrice;
              const discountPercent = hasCutMrp
                ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
                : 0;

              return (
                <article
                  key={product.id}
                  className="new-arrival-card"
                  onClick={() => {
                    if (onProductClick) {
                      onProductClick({
                        ...(product.rawProduct || product),
                        price: displayPrice,
                        compare_price: displayComparePrice,
                        selectedColor: selectedSwatch?.name || undefined,
                      });
                    }
                  }}
                >
                  <div className="new-arrival-img-box">
                    {/* Top-Left Diagonal Corner Ribbon */}
                    <div className="new-arrival-corner-ribbon" aria-hidden="true">
                      NEW
                    </div>

                    {/* Centered Eyewear Product Image */}
                    <img
                      src={productService.getResizedImageUrl(currentImage, 'card')}
                      alt={product.name}
                      className={`new-arrival-img${product.fit === 'cover' ? ' new-arrival-img--cover' : ''}`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = product.img || '/src/assets/home/eye1.jpg';
                      }}
                    />


                  </div>

                  {/* Details Bar: Product Name (Left) & Swatches (Right), plus Price & Cut MRP */}
                  <div className="new-arrival-info">
                    <div className="new-arrival-info-top">
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

                    <div className="new-arrival-price-row">
                      <span className="new-arrival-price">
                        ₹{Number(displayPrice).toLocaleString('en-IN')}
                      </span>
                      {hasCutMrp && (
                        <>
                          <span className="new-arrival-mrp-cut" title="MRP">
                            ₹{Number(displayComparePrice).toLocaleString('en-IN')}
                          </span>
                          {discountPercent > 0 && (
                            <span className="new-arrival-discount-badge">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
