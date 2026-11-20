import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from '../lib/supabase';
import { productService } from "../services/productService";
import { lensService } from "../services/lensService";
import { getOriginalImageUrl } from '../utils/imageUtils';
import { getNavPath } from "../services/categoryRoute";
import { getColorName } from '../utils/colorUtils';
import { resolveThicknessPrice } from '../utils/lensUtils';

import './ProductDetailsPage.css';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import Toast from '../components/Toast';
import SEO from '../components/SEO';
import { useStore } from '../hooks/useStore';

// ── Product Gallery Component (Vertical Thumbnails on Left + Main Image) ──
const ProductGallery = memo(({ activeThumb, setActiveThumb, displayImage, displayName, thumbs }) => {
  const currentIndex = activeThumb === -1 ? 0 : activeThumb;
  const safeIndex = Math.min(currentIndex, thumbs.length - 1);
  const currentImg = getOriginalImageUrl(activeThumb === -1 ? displayImage : thumbs[safeIndex]?.rawImg || displayImage);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  const handleZoomImageClick = (e) => {
    if (!isZoomedIn) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
    }
    setIsZoomedIn(z => !z);
  };

  const closeZoom = () => {
    setZoomOpen(false);
    setIsZoomedIn(false);
  };

  return (
    <div className="dp-gallery-layout">
      {/* Vertical Thumbnails on Left (only when there is more than one image) */}
      {thumbs.length > 1 && (
        <div className="dp-thumbs-vertical-col">
          {thumbs.map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              className={`dp-thumb-item-btn ${currentIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveThumb(idx)}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <img src={getOriginalImageUrl(item.img || item.rawImg)} alt={item.alt || displayName} className="dp-thumb-img" />
            </button>
          ))}
        </div>
      )}

      {/* Main Big Image */}
      <div className="dp-main-image-container">
        <div className="dp-main-image-inner" onClick={() => currentImg && setZoomOpen(true)}>
          {currentImg && (
            <img
              src={currentImg}
              alt={displayName}
              className="dp-main-img-display"
            />
          )}
        </div>
        <p className="dp-image-disclaimer">
          *Disclaimer: Product image is for illustration purposes only. Actual product may vary slightly.
        </p>
      </div>

      {/* Fullscreen Zoom Lightbox */}
      {zoomOpen && currentImg && (
        <div className="dp-zoom-overlay" onClick={closeZoom}>
          <button className="dp-zoom-close-btn" onClick={closeZoom} aria-label="Close zoom">✕</button>
          <img
            src={currentImg}
            alt={displayName}
            className={`dp-zoom-lightbox-img ${isZoomedIn ? 'zoomed' : ''}`}
            onClick={(e) => { e.stopPropagation(); handleZoomImageClick(e); }}
          />
          <p className="dp-zoom-hint">{isZoomedIn ? 'Click to zoom out' : 'Click image to zoom in'}</p>
        </div>
      )}
    </div>
  );
});

const LensTypeIcon = () => (
  <svg viewBox="0 0 64 44" aria-hidden="true" focusable="false">
    <circle cx="20" cy="24" r="13" fill="#dbeafe" stroke="currentColor" strokeWidth="3" />
    <circle cx="44" cy="24" r="13" fill="#dbeafe" stroke="currentColor" strokeWidth="3" />
    <path d="M33 24h-2M7 20 2 18M57 20l5-2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 8h8M40 8h8" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ThicknessIcon = ({ name = "" }) => {
  const count = /ultra/i.test(name) ? 4 : /extra/i.test(name) ? 3 : /thin/i.test(name) ? 2 : 1;
  return (
    <svg viewBox="0 0 42 54" aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, index) => (
        <path key={index} d={`M${7 + index * 8} 6c8 12 8 30 0 42`} fill="none" stroke={index === count - 1 ? "#0a72ff" : "#cbd5e1"} strokeWidth="3" strokeLinecap="round" />
      ))}
    </svg>
  );
};

const getRelatedProductColors = (product) => {
  if (!product) return [];
  const raw = [...parseColors(product.colors)];
  if (Array.isArray(product.product_variants)) {
    product.product_variants.forEach((v) => {
      if (v?.color) raw.push(v.color);
    });
  }
  const seen = new Set();
  const unique = [];
  raw.forEach((c) => {
    const trimmed = typeof c === "string" ? c.trim() : "";
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(trimmed);
    }
  });
  return unique;
};

const cleanNum = (val) => {
  if (val == null) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const n = Number(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
};

// ── Related Products Component ──
const RelatedProducts = memo(({ relatedItems, onProductClick }) => {
  const [selectedRelColors, setSelectedRelColors] = useState({});
  if (!relatedItems || relatedItems.length === 0) return null;
  const visibleRelated = relatedItems.slice(0, 4);

  return (
    <section className="dp-related-section">
      <h2 className="dp-related-title">You May Also Like</h2>
      <div className="dp-related-grid">
        {visibleRelated.map((p) => {
          const cardKey = String(p.id || p.productId || p.product_id || p.name);
          const productColors = getRelatedProductColors(p);
          const activeColor = selectedRelColors[cardKey] ?? productColors[0] ?? null;
          const activeColorName = activeColor ? (getColorName(activeColor) || activeColor) : "";
          const displayTitle =
            activeColorName &&
            p.name &&
            !p.name.toLowerCase().startsWith(`${activeColorName.toLowerCase()} - `)
              ? `${activeColorName} - ${p.name}`
              : p.name;

          const matchingVariants = activeColor && Array.isArray(p.product_variants)
            ? p.product_variants.filter(
                (v) =>
                  String(v.color || "").trim().toLowerCase() === String(activeColor).trim().toLowerCase()
              )
            : [];

          const colorVariantImg = matchingVariants.find(
            (v) => Array.isArray(v.images) && v.images.length > 0
          )?.images?.[0];
          const cardImgUrl = colorVariantImg || p.img || p.image_url;

          const validPrices = matchingVariants
            .map((v) => cleanNum(v.price))
            .filter((n) => n != null && n > 0);
          const cardPrice = validPrices.length > 0 ? Math.min(...validPrices) : (cleanNum(p.price) ?? 0);

          const validCompares = matchingVariants
            .map((v) => cleanNum(v.compare_price))
            .filter((n) => n != null && n > 0);
          const cardComparePrice = validCompares.length > 0 ? Math.max(...validCompares) : cleanNum(p.compare_price);

          const hasCutMrp = cardComparePrice != null && cardComparePrice > cardPrice;
          const discountPercent = hasCutMrp
            ? Math.round(((cardComparePrice - cardPrice) / cardComparePrice) * 100)
            : 0;

          return (
            <div
              key={cardKey}
              className="dp-rel-card"
              onClick={() => onProductClick && onProductClick(p, activeColor, cardImgUrl, cardPrice, cardComparePrice)}
            >
              <div className="dp-rel-img-wrapper">
                <img
                  src={productService.getResizedImageUrl(cardImgUrl, 'card')}
                  alt={displayTitle}
                  className="dp-rel-img"
                  loading="lazy"
                />
              </div>
              <div className="dp-rel-details">
                <div className="dp-rel-details-top-row">
                  <h4 className="dp-rel-name" title={displayTitle}>{displayTitle}</h4>
                  {productColors.length > 0 && (
                    <div className="dp-rel-card-colors" aria-label="Available colors">
                      {productColors.map((color) => {
                        const bg = getColorStyle(color);
                        const cName = getColorName(color) || color;
                        const isWhite =
                          bg.toUpperCase() === "#FFFFFF" ||
                          bg.toLowerCase() === "white" ||
                          String(color).trim().toLowerCase() === "white" ||
                          String(color).trim().toUpperCase() === "#FFFFFF";
                        const isActive =
                          activeColor &&
                          String(activeColor).trim().toLowerCase() === String(color).trim().toLowerCase();

                        return (
                          <button
                            key={color}
                            type="button"
                            className={`dp-rel-color-swatch-btn${isActive ? " active" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRelColors((prev) => ({
                                ...prev,
                                [cardKey]: color,
                              }));
                            }}
                            title={cName}
                            aria-label={`Color ${cName}`}
                          >
                            <span
                              className={`dp-rel-color-dot${isWhite ? " dp-rel-color-dot--white" : ""}`}
                              style={{ backgroundColor: bg }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="dp-rel-price-row">
                  <span className="dp-rel-price">
                    ₹{Number(cardPrice).toLocaleString('en-IN')}
                  </span>
                  {hasCutMrp && (
                    <>
                      <span className="dp-rel-mrp-cut" title="MRP">
                        ₹{Number(cardComparePrice).toLocaleString('en-IN')}
                      </span>
                      {discountPercent > 0 && (
                        <span className="dp-rel-discount-badge">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});

// Color mapping helper for clothing/innerwear colors
const COLOR_MAP = {
  'navy': '#001f3f',
  'navy blue': '#0A2582',
  'royal blue': '#4169E1',
  'sky blue': '#87CEEB',
  'light blue': '#add8e6',
  'deep blue': '#040273',
  'blue': '#0074D9',
  'black': '#111827',
  'white': '#FFFFFF',
  'grey': '#9CA3AF',
  'gray': '#9CA3AF',
  'dark grey': '#4B5563',
  'dark gray': '#4B5563',
  'light grey': '#D1D5DB',
  'light gray': '#D1D5DB',
  'melange': '#A0A0A0',
  'charcoal': '#374151',
  'charcoal grey': '#36454F',
  'skin': '#F3C59A',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'red': '#EF4444',
  'ruby red': '#9B111E',
  'maroon': '#800000',
  'wine': '#722F37',
  'pink': '#E75480',
  'baby pink': '#FFC0CB',
  'green': '#008000',
  'olive': '#808000',
  'olive green': '#556B2F',
  'mint green': '#98FF98',
  'emerald green': '#50C878',
  'teal': '#2DD4BF',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'purple': '#8B2FC9',
  'lavender': '#734F96',
  'brown': '#8B4513',
  'dark brown': '#3E2723'
};

export const getColorStyle = (c) => {
  if (!c) return '#9CA3AF';
  const lower = String(c).trim().toLowerCase();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  if (lower.startsWith('#') || lower.startsWith('rgb') || lower.startsWith('hsl')) return c;
  return lower;
};

export const parseColors = (rawColors) => {
  if (!rawColors) return [];
  let parsed = rawColors;
  if (typeof rawColors === "string") {
    const trimmed = rawColors.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = trimmed.slice(1, -1).split(",").map((s) => s.replace(/['"]/g, "").trim());
      }
    } else {
      parsed = trimmed.split(",").map((s) => s.trim());
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((c) => {
      if (!c) return "";
      if (typeof c === "string") return c.trim();
      if (typeof c === "object") return (c.hex || c.color || c.name || "").trim();
      return String(c).trim();
    })
    .filter(Boolean);
};

export const sortSizesAscending = (sizes) => {
  if (!Array.isArray(sizes)) return [];

  const letterRank = {
    'KIDS': 1,
    'NARROW': 2, 'SMALL': 2, 'S': 2,
    'MEDIUM': 3, 'M': 3,
    'WIDE': 4, 'LARGE': 4, 'L': 4,
    'EXTRA WIDE': 5, 'XL': 5,
    'XXXS': 1, '3XS': 1,
    'XXS': 2, '2XS': 2,
    'XS': 3,
    'XXL': 8, '2XL': 8,
    'XXXL': 9, '3XL': 9,
    '4XL': 10, 'XXXXL': 10,
    '5XL': 11, 'XXXXXL': 11,
    '6XL': 12,
    'FREE': 99, 'FS': 99, 'ONESIZE': 99, 'ONE SIZE': 99, 'FREE SIZE': 99, 'STANDARD': 99
  };

  return [...sizes].sort((a, b) => {
    const strA = String(a).trim();
    const strB = String(b).trim();
    const upperA = strA.toUpperCase();
    const upperB = strB.toUpperCase();

    // 1. Both recognized letter sizes (e.g. S, M, L)
    const rankA = letterRank[upperA];
    const rankB = letterRank[upperB];
    if (rankA !== undefined && rankB !== undefined) {
      return rankA - rankB;
    }

    // 2. Both purely numeric (e.g. "6", "7", "10", "11")
    const numA = Number(strA);
    const numB = Number(strB);
    if (!isNaN(numA) && !isNaN(numB) && strA !== '' && strB !== '') {
      return numA - numB;
    }

    // 3. Strings containing numbers (e.g. "UK 6", "UK 10", "US 9.5")
    const matchA = strA.match(/\d+(\.\d+)?/);
    const matchB = strB.match(/\d+(\.\d+)?/);
    if (matchA && matchB) {
      const valA = parseFloat(matchA[0]);
      const valB = parseFloat(matchB[0]);
      if (valA !== valB) {
        return valA - valB;
      }
    }

    // 4. One has number and one doesn't
    if (matchA && !matchB) return -1;
    if (!matchA && matchB) return 1;

    // 5. Natural alphanumeric comparison
    return strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' });
  });
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ProductDetailsPage({ onBack = () => window.history.back() }) {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const cleanId = (val) => (val ? String(val).replace(/\/+$/, '').trim() : '');
  const rawId = routeId || searchParams.get("id") || searchParams.get("productId") || searchParams.get("product_id") || '';

  // Zustand Store
  const selectedProduct = useStore(state => state.selectedProduct);
  const setSelectedProduct = useStore(state => state.setSelectedProduct);
  const categories = useStore(state => state.categories);
  const addToCart = useStore(state => state.addToCart);
  const cartItems = useStore(state => state.cartItems);
  const fetchProductsByCategory = useStore(state => state.fetchProductsByCategory);
  const productsCache = useStore(state => state.products);

  const activeProductId = cleanId(rawId) || cleanId(selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id);
  const productId = activeProductId;


  const [loadingProduct, setLoadingProduct] = useState(() => {
    if (activeProductId && (!selectedProduct || String(selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id) !== String(activeProductId))) {
      return true;
    }
    return false;
  });
  const [productNotFound, setProductNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedProductId = cleanId(selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id);

  // React States
  const [activeThumb, setActiveThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [productImages, setProductImages] = useState(() => {
    if (selectedProduct?.images && selectedProduct.images.length > 0) return selectedProduct.images;
    if (selectedProduct?.img || selectedProduct?.image_url) return [selectedProduct.img || selectedProduct.image_url];
    return [];
  });
  const [productPrices, setProductPrice] = useState(() => selectedProduct || null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("success");
  const [selectedSize, setSelectedSize] = useState("");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [lensDrawerOpen, setLensDrawerOpen] = useState(false);
  const [selectedLensId, setSelectedLensId] = useState(null);
  const [lensStep, setLensStep] = useState(1);
  const [selectedLensTier, setSelectedLensTier] = useState(null);
  const [lensCatalog, setLensCatalog] = useState([]);
  const [size, setSize] = useState(() => {
    const rawSizes = selectedProduct?.sizes;
    if (rawSizes) {
      let list = [];
      if (Array.isArray(rawSizes)) {
        list = rawSizes.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof rawSizes === "string" && rawSizes.trim()) {
        try {
          const parsed = JSON.parse(rawSizes);
          if (Array.isArray(parsed)) list = parsed.map(s => String(s).trim()).filter(Boolean);
        } catch {
          list = rawSizes.split(",").map(s => s.trim()).filter(Boolean);
        }
      }
      return sortSizesAscending(list);
    }
    return [];
  });

  useEffect(() => {
    let cancelled = false;
    lensService.getLenses()
      .then((lenses) => { if (!cancelled) setLensCatalog(lenses || []); })
      .catch(() => { if (!cancelled) setLensCatalog([]); });
    return () => { cancelled = true; };
  }, []);
  const [hasVariants, setHasVariants] = useState(() => {
    return Boolean(selectedProduct?.has_variants || selectedProduct?.product_variants?.length > 0);
  });
  const [variants, setVariants] = useState(() => {
    return selectedProduct?.product_variants || selectedProduct?.variants || [];
  });
  const colorParam = searchParams.get("color") || "";
  const [selectedColor, setSelectedColor] = useState(() => {
    if (colorParam) {
      return colorParam;
    }
    if (selectedProduct?.selectedColor) {
      return selectedProduct.selectedColor;
    }
    const rawColors = selectedProduct?.colors;
    const parsed = parseColors(rawColors);
    if (parsed.length > 0) {
      return parsed[0];
    }
    const varColors = (selectedProduct?.product_variants || selectedProduct?.variants || []).map((v) => v.color).filter(Boolean);
    if (varColors.length > 0) {
      return varColors[0];
    }
    return "";
  });

  // Sync / fetch product if accessed directly via URL or shared link
  useEffect(() => {
    if (!productId) {
      if (!selectedProduct) {
        setProductNotFound(true);
      }
      return;
    }

    // If navigated without ID in URL, update URL so the address bar reflects the product ID
    if (!routeId && !rawId && productId) {
      navigate(`/product/${productId}`, { replace: true });
    }

    const hasCachedInfo = selectedProductId && String(selectedProductId) === String(productId);
    if (hasCachedInfo) {
      setLoadingProduct(false);
      setProductNotFound(false);
    } else {
      setLoadingProduct(true);
      setProductNotFound(false);
    }

    let isMounted = true;

    productService.getProductById(productId)
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          if (!hasCachedInfo) {
            setProductNotFound(true);
          }
          setLoadingProduct(false);
          return;
        }

        const baseImages = Array.isArray(data.images) && data.images.length > 0
          ? data.images
          : (data.image_url ? [data.image_url] : []);

        const parsedColorsList = parseColors(data.colors);

        const formatted = {
          ...data,
          id: data.product_id,
          productId: data.product_id,
          product_id: data.product_id,
          name: data.name,
          desc: data.description,
          description: data.description,
          care_instructions: data.care_instructions || '',
          price: data.price,
          compare_price: data.compare_price || data.price,
          original: `₹${data.compare_price || data.price}.00`,
          img: baseImages[0] || '',
          image: baseImages[0] || '',
          images: baseImages,
          image_url: data.image_url || baseImages[0] || '',
          category: data.categories?.name || 'Eyewear',
          type: data.subcategories?.name || '',
          subcategory: data.subcategories?.name || '',
          frame_shape: data.frame_shape || '',
          frame_measurements: data.frame_measurements || '',
          sku: data.sku || '',
          stock: data.stock,
          sizes: [],
          colors: parsedColorsList,
        };

        const varSizes = (data.product_variants || []).map(v => v.size).filter(Boolean);
        let baseSizes = [];
        if (data.sizes) {
          if (Array.isArray(data.sizes)) {
            baseSizes = data.sizes;
          } else if (typeof data.sizes === 'string' && data.sizes.trim()) {
            try {
              const jsonParsed = JSON.parse(data.sizes);
              if (Array.isArray(jsonParsed)) baseSizes = jsonParsed;
              else baseSizes = [data.sizes];
            } catch {
              baseSizes = data.sizes.split(',').map(s => s.trim()).filter(Boolean);
            }
          }
        }
        const realSizes = sortSizesAscending(Array.from(new Set([...baseSizes, ...varSizes].map(s => String(s).trim()).filter(Boolean))));
        formatted.sizes = realSizes;

        setProductImages(baseImages);
        setProductPrice({
          ...data,
          colors: parsedColorsList,
        });

        const rawVariants = data.product_variants || [];
        setVariants(rawVariants);
        setHasVariants(Boolean(data.has_variants || rawVariants.length > 0));

        const allColors = parsedColorsList.length > 0
          ? parsedColorsList
          : [...new Set(rawVariants.map((v) => v.color).filter(Boolean))];

        const desiredColor = colorParam || selectedProduct?.selectedColor || "";
        const matchedDesiredColor = desiredColor
          ? allColors.find((c) => String(c).trim().toLowerCase() === String(desiredColor).trim().toLowerCase())
          : null;

        if (matchedDesiredColor) {
          setSelectedColor(matchedDesiredColor);
        } else if (allColors[0]) {
          setSelectedColor((prev) => prev || allColors[0]);
        }

        setSize(realSizes);
        setSelectedSize(prev => (prev && realSizes.includes(prev)) ? prev : (realSizes.length === 1 ? realSizes[0] : ""));

        setSelectedProduct({
          ...formatted,
          ...(matchedDesiredColor ? { selectedColor: matchedDesiredColor } : {}),
        });
        setLoadingProduct(false);
      })
      .catch((err) => {
        console.error("Failed to load product by ID:", err);
        if (isMounted) {
          if (!hasCachedInfo) {
            setProductNotFound(true);
          }
          setLoadingProduct(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId, routeId, rawId, selectedProductId, setSelectedProduct, navigate]);

  const cat = selectedProduct?.category || 'Briefs';

  const showToast = (message, type = "success") => {
    setToastMsg("");
    setToastType(type);
    setTimeout(() => setToastMsg(message), 10);
  };

  const activeSizeValue = selectedSize;

  // Strict match for variant based on selected size and selected color
  const matchedSizeVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;

    const normSize = String(activeSizeValue || "").trim().toLowerCase();
    const normColor = String(selectedColor || "").trim().toLowerCase();

    // 1. Both size and color match
    if (normSize && normColor) {
      const match = variants.find(
        (v) =>
          String(v.size || "").trim().toLowerCase() === normSize &&
          String(v.color || "").trim().toLowerCase() === normColor
      );
      if (match) return match;
    }

    // 2. Size match
    if (normSize) {
      const match = variants.find(
        (v) => String(v.size || "").trim().toLowerCase() === normSize
      );
      if (match) return match;
    }

    // 3. Color match
    if (normColor) {
      const match = variants.find(
        (v) => String(v.color || "").trim().toLowerCase() === normColor
      );
      if (match) return match;
    }

    return null;
  }, [variants, activeSizeValue, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (matchedSizeVariant) return matchedSizeVariant;
    if (!variants || variants.length === 0) return null;
    return (
      variants.find(
        (v) => (v.color || "") === (selectedColor || "") && v.images?.length > 0
      ) ||
      variants[0] ||
      null
    );
  }, [matchedSizeVariant, variants, selectedColor]);


  const rawPrice = hasVariants
    ? (matchedSizeVariant?.price ?? selectedVariant?.price ?? productPrices?.price ?? selectedProduct?.price ?? variants[0]?.price ?? null)
    : (matchedSizeVariant?.price ?? productPrices?.price ?? selectedProduct?.price ?? null);

  const rawCompare = hasVariants
    ? (matchedSizeVariant?.compare_price ?? selectedVariant?.compare_price ?? productPrices?.compare_price ?? selectedProduct?.compare_price ?? variants[0]?.compare_price ?? null)
    : (matchedSizeVariant?.compare_price ?? productPrices?.compare_price ?? selectedProduct?.compare_price ?? null);

  const displayImage = selectedProduct?.img || selectedProduct?.image || selectedProduct?.image_url || '';
  const displayName = selectedProduct?.name || '';

  const displaySku = matchedSizeVariant?.sku || selectedVariant?.sku || productPrices?.sku || selectedProduct?.sku || '';

  const stockCount = useMemo(() => {
    // If product has size variants and a size is selected, strictly return that size's stock
    if (variants && variants.length > 0 && selectedSize) {
      if (matchedSizeVariant) {
        return Math.max(0, parseInt(matchedSizeVariant.stock, 10) || 0);
      }
      return 0;
    }

    // If product has size variants but no size has been selected yet
    if (variants && variants.length > 0 && size.length > 0 && !selectedSize) {
      const totalVarStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
      return totalVarStock;
    }

    // Simple product without variants table
    const baseStock = productPrices?.stock ?? selectedProduct?.stock;
    if (baseStock != null && !isNaN(parseInt(baseStock, 10))) {
      return Math.max(0, parseInt(baseStock, 10));
    }

    return 0;
  }, [variants, selectedSize, matchedSizeVariant, size, productPrices, selectedProduct]);

  const cleanNum = (val) => {
    if (val == null) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const n = Number(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  };

  const payPrice = cleanNum(rawPrice) ?? 150;
  const productLensOptions = useMemo(() => {
    const configuredOptions = productPrices?.lens_options || selectedProduct?.lens_options || [];
    return configuredOptions.map((option) => {
      const catalogLens = lensCatalog.find((lens) => String(lens.id) === String(option.lensId));
      const rawTiers = Array.isArray(option.thicknesses) && option.thicknesses.length > 0
        ? option.thicknesses
        : (catalogLens?.thicknesses || []).map((t) => ({
            thicknessId: t.id,
            name: t.name,
            index: t.index || t.lens_index || "",
            range: t.range || t.power_range || "",
            addonPrice: Number(t.basePrice ?? t.base_price ?? 0),
            bestSuitedFor: t.bestSuitedFor || t.best_suited_for || "",
          }));
      const flatPrice = Number(
        option.addonPrice ??
        option.price ??
        option.basePrice ??
        catalogLens?.addonPrice ??
        catalogLens?.price ??
        catalogLens?.basePrice ??
        catalogLens?.base_price ??
        0
      );
      return {
        ...option,
        lensName: option.lensName || catalogLens?.name || "Lens",
        flatPrice,
        thicknesses: rawTiers.map((tier) => {
          const catalogTier = catalogLens?.thicknesses?.find((catalogItem) => String(catalogItem.id) === String(tier.thicknessId || tier.id));
          return {
            ...tier,
            name: tier.name || catalogTier?.name || "Standard",
            index: tier.index || catalogTier?.index || catalogTier?.lens_index || "",
            range: tier.range || catalogTier?.range || catalogTier?.power_range || "",
            addonPrice: resolveThicknessPrice(tier, catalogTier),
            bestSuitedFor: tier.bestSuitedFor || tier.best_suited_for || catalogTier?.bestSuitedFor || catalogTier?.best_suited_for || "",
          };
        }),
      };
    });
  }, [productPrices, selectedProduct, lensCatalog]);
  const lensAddonPrice = resolveThicknessPrice(selectedLensTier);
  const lensTotal = payPrice + lensAddonPrice;
  const strikePrice = cleanNum(rawCompare);
  const discountPercent =
    strikePrice != null && strikePrice > payPrice
      ? Math.round(((strikePrice - payPrice) / strikePrice) * 100)
      : 0;

  const canAddToCart = stockCount > 0;

  // Available colors: when a size is selected, ONLY show colors available for that size!
  const availableColors = useMemo(() => {
    if (hasVariants && selectedSize && variants?.length > 0) {
      const normSize = String(selectedSize).trim().toLowerCase();
      const colorsForSize = variants
        .filter((v) => String(v.size || "").trim().toLowerCase() === normSize && v.color)
        .map((v) => v.color)
        .filter(Boolean);
      return [...new Set(colorsForSize)];
    }

    const variantColors = (variants || []).map((v) => v.color).filter(Boolean);
    if (hasVariants && variantColors.length > 0) {
      return [...new Set(variantColors)];
    }

    const rawColors = productPrices?.colors || selectedProduct?.colors;
    const parsed = parseColors(rawColors);
    if (parsed.length > 0) return parsed;

    if (variantColors.length > 0) {
      return [...new Set(variantColors)];
    }
    return [];
  }, [hasVariants, variants, selectedSize, productPrices, selectedProduct]);

  const activeColorForTitle = selectedColor || (availableColors.length > 0 ? availableColors[0] : "");
  const activeColorLabel = activeColorForTitle ? (getColorName(activeColorForTitle) || activeColorForTitle) : "";
  const displayTitle =
    activeColorLabel &&
    displayName &&
    !displayName.toLowerCase().startsWith(`${activeColorLabel.toLowerCase()} - `)
      ? `${activeColorLabel} - ${displayName}`
      : displayName;

  // Auto-sync selectedColor when selectedSize changes or availableColors updates
  useEffect(() => {
    if (!hasVariants || !variants || variants.length === 0) return;

    if (availableColors.length > 0) {
      setSelectedColor((prev) => {
        if (prev) {
          const match = availableColors.find(
            (c) => String(c).trim().toLowerCase() === String(prev).trim().toLowerCase()
          );
          if (match) return match;
        }
        return availableColors[0];
      });
    } else {
      setSelectedColor("");
    }
  }, [selectedSize, availableColors, hasVariants, variants]);

  useEffect(() => {
    setActiveThumb(0);
  }, [selectedSize, selectedColor]);

  // Variant-aware check (strictly checks selected color and size)
  const isCurrentProductInCart = useMemo(() => {
    if (!productId || !cartItems || cartItems.length === 0) return false;

    const currentId = String(productId).trim();
    const activeColorNorm = String(selectedColor || (availableColors.length === 1 ? availableColors[0] : '') || '').trim().toLowerCase();
    const activeSizeNorm = String(selectedSize || (Array.isArray(size) && size.length === 1 ? size[0] : '') || '').trim().toLowerCase();

    return cartItems.some((item) => {
      const itemPid = String(item.productId || item.product_id || item.id || '').trim();
      if (itemPid !== currentId) return false;

      // Color check: If product offers colors
      if (availableColors && availableColors.length > 0) {
        if (activeColorNorm) {
          const itemColorNorm = String(item.color || '').trim().toLowerCase();
          if (itemColorNorm !== activeColorNorm) return false;
        } else {
          return false;
        }
      }

      // Size check: If product offers sizes
      if (Array.isArray(size) && size.length > 0) {
        if (activeSizeNorm) {
          const itemSizeNorm = String(item.size || '').trim().toLowerCase();
          if (itemSizeNorm !== activeSizeNorm) return false;
        } else {
          return false;
        }
      }

      return true;
    });
  }, [productId, cartItems, selectedColor, selectedSize, availableColors, size]);

  // Gallery Thumbnails
  const dynamicThumbs = useMemo(() => {
    let imgs = [];

    if (hasVariants) {
      if (selectedVariant?.images && selectedVariant.images.length > 0) {
        imgs = selectedVariant.images;
      } else {
        const anyVariantWithImages = variants.find(v => v.images?.length > 0);
        if (anyVariantWithImages) {
          imgs = anyVariantWithImages.images;
        }
      }
    }

    if (imgs.length === 0 && productImages.length > 0) {
      imgs = productImages;
    }

    if (imgs.length === 0 && displayImage) {
      imgs = [displayImage];
    }

    // Only the product's real images, each once
    imgs = [...new Set(imgs.filter(Boolean))];

    return imgs.map((img, i) => ({
      id: i + 1,
      img: getOriginalImageUrl(img),
      rawImg: getOriginalImageUrl(img),
      alt: `${displayName} view ${i + 1}`
    }));
  }, [productImages, displayImage, displayName, hasVariants, selectedVariant, variants]);

  useEffect(() => {
    fetchProductsByCategory(cat);
  }, [cat, fetchProductsByCategory]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveThumb(0);
    setQty(1);
  }, [selectedProduct]);

  const dynamicRelated = useMemo(() => {
    const dbProducts = productsCache[cat] || [];
    const currentId = selectedProduct?.productId || selectedProduct?.id;

    return dbProducts
      .filter((p) => p.id !== currentId && p.productId !== currentId)
      .map((p) => ({
        ...p,
        price: p.price || 150,
        category: p.category || cat,
      }));
  }, [cat, productsCache, selectedProduct]);

  const handleThumbClick = useCallback((i) => {
    setActiveThumb(i);
  }, []);

  const handleQtyChange = useCallback((delta) => {
    setQty(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (stockCount != null && next > stockCount) {
        return Math.max(1, stockCount);
      }
      return next;
    });
  }, [stockCount]);

  // Clamp quantity to selected size stock whenever size or stockCount updates
  useEffect(() => {
    if (selectedSize && stockCount != null && stockCount > 0) {
      if (qty > stockCount) {
        setQty(stockCount);
      } else if (qty < 1) {
        setQty(1);
      }
    }
  }, [selectedSize, stockCount]);

  const handleHeaderLinkClick = (link) => {
    if (link === "Home") {
      navigate("/");
    } else {
      navigate(getNavPath(link, categories));
    }
  };

  const handleRelatedProductClick = useCallback(
    (product, color = null, customImg = null, price = null, comparePrice = null) => {
      setSelectedProduct({
        ...product,
        category: product.category || cat,
        ...(color ? { selectedColor: color } : {}),
        ...(customImg ? { img: customImg, image: customImg } : {}),
        ...(price != null ? { price } : {}),
        ...(comparePrice != null ? { compare_price: comparePrice } : {}),
      });
      if (color) {
        setSelectedColor(color);
      }
      const pid = product.product_id || product.productId || product.id;
      const colorQuery = color ? `?color=${encodeURIComponent(color)}` : "";
      navigate(pid ? `/product/${pid}${colorQuery}` : "/product");
    },
    [cat, setSelectedProduct, navigate]
  );

  const getShareUrl = useCallback(() => {
    const pid = cleanId(productId) || selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id;
    if (pid) {
      return `${window.location.origin}/product/${pid}`;
    }
    return window.location.href.split('?')[0].replace(/\/+$/, '');
  }, [productId, selectedProduct]);

  // SEO & Social Open Graph metadata
  const seoData = useMemo(() => {
    if (productNotFound) {
      return {
        title: "Product Not Found | Zion Eye Care Clinic",
        robots: "noindex, follow",
      };
    }
    const prodName = displayName || selectedProduct?.name || 'Product';
    const desc = selectedProduct?.description || selectedProduct?.desc || 'Discover premium optical lenses and stylish eyeglasses on Zion Eye Care Clinic.';
    const cleanDesc = desc.replace(/<[^>]*>?/gm, '').slice(0, 200);
    const productImg = selectedProduct?.img || selectedProduct?.image_url || selectedProduct?.images?.[0] || '';
    const fullImgUrl = productImg.startsWith('http')
      ? productImg
      : (productImg ? `${window.location.origin}${productImg}` : `${window.location.origin}/zionlogo.png`);
    const shareUrl = getShareUrl();

    return {
      title: `${prodName} | Zion Eye Care Clinic`,
      description: cleanDesc,
      canonical: shareUrl,
      ogType: 'product',
      ogImage: fullImgUrl,
      ogImageAlt: prodName,
      productData: {
        id: cleanId(productId) || selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id,
        name: prodName,
        sku: displaySku || selectedProduct?.sku || selectedProduct?.product_id,
        price: payPrice,
        currency: 'INR',
        description: cleanDesc,
        brand: 'Zion Eye Care Clinic',
        inStock: canAddToCart,
        images: dynamicThumbs?.length > 0 ? dynamicThumbs.map(t => t.img).filter(Boolean) : [fullImgUrl],
      },
      breadcrumbs: [
        { name: 'Home', path: '/' },
        ...(cat ? [{ name: cat, path: `/category/${cat.toLowerCase().replace(/\s+/g, '-')}` }] : []),
        { name: prodName, path: `/product/${cleanId(productId) || selectedProduct?.product_id || ''}` },
      ],
    };
  }, [productNotFound, displayName, selectedProduct, getShareUrl, productId, displaySku, payPrice, canAddToCart, dynamicThumbs, cat]);

  // Reliable clipboard copy supporting Instagram In-App Browser and iOS WebViews
  const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fall back to execCommand for restricted in-app webviews
      }
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0.01';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch (e) {
      return false;
    }
  };

  const handleShareProduct = async (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const shareUrl = getShareUrl();
    const shareTitle = displayName || 'Zion Eye Care Clinic';
    const shareText = `Check out ${displayName || 'this eyewear'} on Zion Eye Care Clinic!`;

    // 1. On mobile devices, trigger native OS share sheet synchronously on click
    // (allows direct 1-tap share to Instagram Stories, Chats, WhatsApp, etc.)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ url: shareUrl })) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          // User dismissed the native share dialog
          return;
        }
        // Fall through to clipboard copy if native share threw an unexpected error
      }
    }

    // 2. Clipboard copy fallback (guaranteed to work in Instagram In-App Browser & desktop)
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast('Product link copied! Share it on Instagram & more', 'success');
    } else {
      showToast('Link copied to clipboard', 'info');
    }
  };

  const validateOptionsSelection = useCallback(() => {
    const hasSizes = Array.isArray(size) && size.length > 0;
    // Only multi-variant products with multiple colors require manual color selection
    const requiresColorSelection = Boolean(selectedProduct?.has_variants && availableColors.length > 1);

    const missingSize = hasSizes && !selectedSize;
    const missingColor = requiresColorSelection && !selectedColor;

    if (missingSize && missingColor) {
      showToast("Please select size and color", "error");
      return false;
    }
    if (missingSize) {
      showToast("Please select a size", "error");
      return false;
    }
    if (missingColor) {
      showToast("Please select a color", "error");
      return false;
    }
    return true;
  }, [size, availableColors, selectedSize, selectedColor, selectedProduct]);

  const handleAddToCart = async (lensTier = null) => {
    if (isCurrentProductInCart) return false;
    if (!validateOptionsSelection()) {
      return false;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/account/signup");
      return false;
    }
    if (!canAddToCart) return false;

    // Distinguish between passing a lens tier object vs passing a React Click Event
    const activeLensTier = (lensTier && lensTier.lensName) ? lensTier : selectedLensTier;
    const finalAddonPrice = activeLensTier ? resolveThicknessPrice(activeLensTier) : 0;
    const finalItemPrice = payPrice + finalAddonPrice;

    if (selectedProduct) {
      const sizeParam = selectedSize || null;
      const colorParam = selectedColor || availableColors[0] || null;
      const cartProductPayload = {
        ...selectedProduct,
        productId: selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id,
        id: selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id,
        name: displayName,
        price: finalItemPrice,
        framePrice: payPrice,
        lensAddonPrice: finalAddonPrice,
        originalPrice: strikePrice,
        compare_price: strikePrice,
        image: dynamicThumbs[0]?.img || selectedVariant?.images?.[0] || displayImage,
        img: dynamicThumbs[0]?.img || selectedVariant?.images?.[0] || displayImage,
        category: cat,
        category_id: selectedProduct?.category_id || selectedProduct?.categoryId,
        subcategory: selectedProduct?.subcategory || selectedProduct?.type,
        subcategory_id: selectedProduct?.subcategory_id || selectedProduct?.subcategoryId,
        stock: stockCount,
        stockCount: stockCount,
        lensSelection: activeLensTier ? {
          lensName: activeLensTier.lensName,
          thicknessName: activeLensTier.name,
          thicknessId: activeLensTier.thicknessId,
          addonPrice: finalAddonPrice,
        } : null,
      };
      await addToCart(cartProductPayload, qty, sizeParam, colorParam);
      showToast(activeLensTier ? `Added "${displayName}" with ${activeLensTier.lensName} to cart!` : `Added "${displayName}" to cart!`);
      return true;
    }
    return false;
  };

  const handleBuyNow = useCallback(async () => {
    if (!validateOptionsSelection()) {
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/account/signup");
      return;
    }
    if (!canAddToCart) return;

    const sizeParam = selectedSize || null;
    const colorParam = selectedColor || availableColors[0] || null;
    const activeLensTier = selectedLensTier;
    const finalAddonPrice = activeLensTier ? resolveThicknessPrice(activeLensTier) : 0;
    const finalItemPrice = payPrice + finalAddonPrice;

    const checkoutPayload = {
      productId: selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id,
      id: selectedProduct?.productId || selectedProduct?.id || selectedProduct?.product_id,
      name: displayName,
      price: finalItemPrice,
      framePrice: payPrice,
      lensAddonPrice: finalAddonPrice,
      originalPrice: strikePrice,
      qty: qty,
      stock: stockCount,
      stockCount: stockCount,
      img: dynamicThumbs[0]?.img || selectedVariant?.images?.[0] || displayImage,
      category: cat,
      category_id: selectedProduct?.category_id || selectedProduct?.categoryId,
      subcategory: selectedProduct?.subcategory || selectedProduct?.type,
      subcategory_id: selectedProduct?.subcategory_id || selectedProduct?.subcategoryId,
      sku: displaySku || selectedProduct?.sku || selectedVariant?.sku || '',
      size: sizeParam,
      color: colorParam,
      lensSelection: activeLensTier ? {
        lensName: activeLensTier.lensName,
        thicknessName: activeLensTier.name,
        thicknessId: activeLensTier.thicknessId,
        addonPrice: finalAddonPrice,
      } : null,
    };

    try {
      sessionStorage.setItem("zion_checkout_product", JSON.stringify(checkoutPayload));
      localStorage.setItem("zion_checkout_product", JSON.stringify(checkoutPayload));
      sessionStorage.removeItem("zion_checkout_selected_items");
      localStorage.removeItem("zion_checkout_selected_items");
    } catch (e) {
      console.warn("Could not save checkout item to storage", e);
    }

    navigate("/checkout", {
      state: {
        product: checkoutPayload
      }
    });
  }, [validateOptionsSelection, displayName, payPrice, strikePrice, qty, dynamicThumbs, selectedVariant, displayImage, cat, displaySku, selectedProduct, selectedSize, selectedColor, selectedLensTier, canAddToCart, navigate]);

  return (
    <div className="dp-page-root">
      {seoData && <SEO {...seoData} />}
      {/* ── HEADER ── */}
      <SiteHeader activeLink="" onLinkClick={handleHeaderLinkClick} />

      {/* ── PRODUCT DETAIL MAIN CONTAINER ── */}
      {loadingProduct ? (
        <main className="dp-detail-main dp-state-container">
          <div className="dp-state-box">
            <div className="dp-loading-spinner" />
            <p className="dp-state-text">Loading product details...</p>
          </div>
        </main>
      ) : productNotFound ? (
        <main className="dp-detail-main dp-state-container">
          <div className="dp-state-box">
            <h2 className="dp-state-heading">Product Not Found</h2>
            <p className="dp-state-subtext">
              The product you are looking for is no longer available or the link may be incorrect.
            </p>
            <button
              type="button"
              className="dp-explore-btn"
              onClick={() => navigate('/all-products')}
            >
              Explore All Products
            </button>
          </div>
        </main>
      ) : (
        <main className="dp-detail-main">
          {/* Left Column: Vertical Thumbs + Main Image */}
          <div className="dp-gallery-column">
            <ProductGallery
              activeThumb={activeThumb}
              setActiveThumb={handleThumbClick}
              displayImage={displayImage}
              displayName={displayTitle}
              thumbs={dynamicThumbs}
            />
          </div>

          {/* Right Column: Title, Price, Options, Actions, Specs */}
          <div className="dp-info-column">
            {/* Title & Share Row */}
            <div className="dp-title-share-row">
              <h1 className="dp-title">{displayTitle.toUpperCase()}</h1>
              <button
                type="button"
                className={`dp-share-btn ${copied ? 'copied' : ''}`}
                onClick={handleShareProduct}
                title={copied ? "Link Copied!" : "Share product link"}
                aria-label={copied ? "Link Copied!" : "Share product link"}
              >
                {copied ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                )}
              </button>
            </div>

            {/* Price & Stock Status */}
            <div className="dp-price-row">
              <span className="dp-price-text">Rs. {payPrice.toLocaleString('en-IN')}</span>
              {strikePrice != null && strikePrice > payPrice && (
                <>
                  <span className="dp-price-mrp-cut">
                    Rs. {strikePrice.toLocaleString('en-IN')}
                  </span>
                  {discountPercent > 0 && (
                    <span className="dp-price-discount-badge">{discountPercent}% OFF</span>
                  )}
                </>
              )}
              <span className="dp-stock-status">
                {stockCount === 0 && selectedSize ? (
                  <span className="dp-stock-out">Out of Stock ({selectedSize})</span>
                ) : stockCount === 0 ? (
                  <span className="dp-stock-out">Out of Stock</span>
                ) : selectedSize ? (
                  <span className="dp-stock-in">
                    In Stock ({stockCount} available)
                  </span>
                ) : (
                  <span className="dp-stock-in">In Stock</span>
                )}
              </span>
            </div>

            {/* Short Description */}
            {(selectedProduct?.desc || selectedProduct?.description) && (
              <div className="dp-desc-section">
                <h4 className="dp-desc-title">Description</h4>
                <div className="dp-short-desc">
                  {productService.normalizeProductCare(selectedProduct)?.description ||
                    productService.normalizeProductCare(selectedProduct)?.desc}
                </div>
              </div>
            )}

          {/* Select Color */}
          {availableColors.length > 0 && (
            <div className="dp-option-section">
              <h4 className="dp-option-title">
                Select Color {selectedColor ? <span className="dp-selected-choice-badge">: {getColorName(selectedColor)}</span> : null}
              </h4>
              <div className="dp-color-swatches-row">
                {availableColors.map((c) => {
                  const bg = getColorStyle(c);
                  const isWhite = bg.toUpperCase() === '#FFFFFF' || String(c).toLowerCase() === 'white';
                  const colorLabel = getColorName(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`dp-swatch-ring-btn ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(c)}
                      aria-label={`Select color ${colorLabel}`}
                      title={colorLabel}
                    >
                      <span
                        className={`dp-swatch-circle ${isWhite ? 'dp-swatch-circle--white' : ''}`}
                        style={{ backgroundColor: bg }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Select Size */}
          {size.length > 0 && (
            <div className="dp-option-section">
              <h4 className="dp-option-title">
                Select Size {selectedSize ? <span className="dp-selected-choice-badge">: {selectedSize}</span> : null}
              </h4>
              <div className="dp-size-buttons-row">
                {sortSizesAscending(size).map((s) => {
                  return (
                    <button
                      key={s}
                      type="button"
                      className={`dp-size-pill-btn ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Select Quantity */}
          <div className="dp-option-section">
            <h4 className="dp-option-title">
              Select Quantity
              {selectedSize && stockCount > 0 && stockCount <= 5 ? (
                <span className="dp-stock-low-tag"> (Only {stockCount} left!)</span>
              ) : null}
            </h4>
            <div className="dp-qty-stepper-wrap">
              <button
                type="button"
                className="dp-qty-btn-circle"
                onClick={() => handleQtyChange(-1)}
                disabled={qty <= 1 || stockCount <= 0}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="dp-qty-box-value">
                {stockCount === 0 && selectedSize ? 0 : qty}
              </div>
              <button
                type="button"
                className="dp-qty-btn-circle"
                onClick={() => handleQtyChange(1)}
                disabled={stockCount <= 0 || qty >= stockCount}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dp-action-buttons-group">
            <div className="dp-purchase-actions">
              <button type="button" className="dp-lens-select-btn" disabled={!productLensOptions.length} onClick={() => { setLensDrawerOpen(true); setLensStep(1); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7" cy="13" r="4" /><circle cx="17" cy="13" r="4" /><path d="M11 13h2M3 13l1-5h3M21 13l-1-5h-3" /></svg>
                {productLensOptions.length ? "SELECT LENS" : "FRAME ONLY (WITHOUT LENSES)"}
              </button>
            </div>
            <button
              type="button"
              className={`dp-add-cart-btn ${isCurrentProductInCart ? 'in-cart' : ''}`}
              disabled={!canAddToCart || isCurrentProductInCart}
              onClick={handleAddToCart}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M2 3h3l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 7H6" /></svg>
              {canAddToCart ? (isCurrentProductInCart ? "ALREADY IN CART" : "ADD TO CART") : "OUT OF STOCK"}
            </button>
          </div>

          {!productLensOptions.length && (
            <div className="dp-frame-only-note">
              <span>Sold as frame only (without lenses)</span>
            </div>
          )}

          {lensDrawerOpen && (
            <div className="dp-lens-overlay" onClick={() => setLensDrawerOpen(false)}>
              <aside className="dp-lens-drawer" onClick={(event) => event.stopPropagation()}>
                <div className="dp-lens-drawer-header">{lensStep === 2 && <button className="dp-lens-back" type="button" onClick={() => setLensStep(1)} aria-label="Back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg></button>}<h3>{lensStep === 1 ? "Select Lens Type" : "Adjust Your Lens"}</h3><button type="button" onClick={() => setLensDrawerOpen(false)} aria-label="Close lens selection">×</button></div>
                {/* Selected Frame Preview */}
                <div className="dp-lens-frame-preview">
                  <div className="dp-lens-frame-img-wrap">
                    <img src={getOriginalImageUrl(dynamicThumbs[activeThumb === -1 ? 0 : activeThumb]?.rawImg || displayImage)} alt={displayName} className="dp-lens-frame-img" />
                  </div>
                  <div className="dp-lens-frame-info">
                    <span className="dp-lens-frame-name">{displayName}</span>
                    <span className="dp-lens-frame-price">Frame: ₹{payPrice.toLocaleString('en-IN')}</span>
                    {selectedSize && <span className="dp-lens-frame-meta">Size: {selectedSize}</span>}
                    {selectedColor && <span className="dp-lens-frame-meta">Color: {getColorName(selectedColor) || selectedColor}</span>}
                  </div>
                </div>
                <div className="dp-lens-options">
                  {lensStep === 1 ? (
                    <>
                      <h4 className="dp-lens-thickness-title">Choose Lens</h4>
                      {productLensOptions.map((lens) => {
                        const hasThicknesses = Array.isArray(lens.thicknesses) && lens.thicknesses.length > 0;
                        const isSelected = String(selectedLensId) === String(lens.lensId);
                        const resolvedPrice = resolveThicknessPrice({
                          lensName: lens.lensName,
                          addonPrice: lens.flatPrice,
                        });

                        return (
                          <button
                            type="button"
                            key={lens.lensId}
                            className={`dp-lens-type-card${isSelected ? " selected" : ""}`}
                            onClick={() => {
                              if (hasThicknesses) {
                                if (!isSelected) setSelectedLensTier(null);
                                setSelectedLensId(lens.lensId);
                                setLensStep(2);
                              } else {
                                setSelectedLensId(lens.lensId);
                                setLensStep(1);
                                setSelectedLensTier({
                                  lensId: lens.lensId,
                                  lensName: lens.lensName,
                                  name: "Standard",
                                  thicknessName: "Standard",
                                  thicknessId: "default",
                                  addonPrice: resolvedPrice,
                                  key: `${lens.lensId}-default`,
                                });
                              }
                            }}
                          >
                            <span className="dp-lens-icon"><LensTypeIcon /></span>
                            <span className="dp-lens-type-card-copy">
                              <strong>{lens.lensName}</strong>
                              <small>
                                {hasThicknesses
                                  ? "Choose the best lens option for your vision."
                                  : "Standard optical lens protection"}
                              </small>
                            </span>
                            {!hasThicknesses && (
                              <b className="dp-lens-card-price">
                                + ₹{Number(resolvedPrice || 0).toLocaleString("en-IN")}
                              </b>
                            )}
                          </button>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <h4 className="dp-lens-thickness-title">Choose Thickness</h4>
                      <p className="dp-lens-note">All lenses are blue-violet light protected for digital screens</p>
                      {(productLensOptions.find((lens) => String(lens.lensId) === String(selectedLensId))?.thicknesses || []).map((tier) => {
                        const lens = productLensOptions.find((option) => String(option.lensId) === String(selectedLensId));
                        const key = `${lens.lensId}-${tier.thicknessId}`;
                        const selected = selectedLensTier?.key === key;
                        const suitability = tier.bestSuitedFor || tier.best_suited_for || "";
                        return (
                          <button
                            type="button"
                            key={key}
                            className={`dp-lens-option${selected ? " selected" : ""}`}
                            onClick={() => setSelectedLensTier({ ...tier, lensName: lens.lensName, key })}
                          >
                            <span className="dp-thickness-icon"><ThicknessIcon name={tier.name} /></span>
                            <span className="dp-lens-option-copy">
                              <strong>{tier.name}</strong>
                              <small>{tier.index} · {tier.range}</small>
                              {suitability && <small className="dp-lens-suitability">Best suited for: {suitability}</small>}
                            </span>
                            <b>+ ₹{Number(tier.addonPrice || 0).toLocaleString("en-IN")}</b>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
                {selectedLensTier && <div className="dp-lens-summary"><span>Frame + {selectedLensTier.lensName}</span><b>₹{lensTotal.toLocaleString("en-IN")}</b><button type="button" disabled={!canAddToCart || isCurrentProductInCart} onClick={async () => { const added = await handleAddToCart(selectedLensTier); if (added) setLensDrawerOpen(false); }}>{isCurrentProductInCart ? "Already in Cart" : "Add to Cart"}</button></div>}
              </aside>
            </div>
          )}

          {/* Care Instructions & Product Specifications Dropdowns */}
          <div className="dp-info-accordions">
            <div className={`dp-sizeguide-dropdown dp-info-dropdown ${specsOpen ? "open" : ""}`}>
              <button
                type="button"
                className="dp-sizeguide-toggle"
                onClick={() => setSpecsOpen((prev) => !prev)}
                aria-expanded={specsOpen}
              >
                <span className="dp-sizeguide-label">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="7" y1="8" x2="17" y2="8" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                    <line x1="7" y1="16" x2="13" y2="16" />
                  </svg>
                  <span>Product Specifications</span>
                </span>
                <svg
                  className="dp-sizeguide-chevron"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {specsOpen && (
                <div className="dp-sizeguide-body dp-info-dropdown-body">
                  <div className="dp-specs-table">
                    <div className="dp-specs-row">
                      <span className="dp-specs-label">Category :</span>
                      <span className="dp-specs-value">{selectedProduct?.category || cat || "Eyewear"}</span>
                    </div>
                    {(selectedProduct?.subcategory || selectedProduct?.type) && (
                      <div className="dp-specs-row">
                        <span className="dp-specs-label">Collection / Style :</span>
                        <span className="dp-specs-value">{selectedProduct?.subcategory || selectedProduct?.type}</span>
                      </div>
                    )}
                    {selectedProduct?.frame_shape && (
                      <div className="dp-specs-row">
                        <span className="dp-specs-label">Frame Shape :</span>
                        <span className="dp-specs-value">{selectedProduct.frame_shape}</span>
                      </div>
                    )}
                    {selectedProduct?.frame_measurements && (
                      <div className="dp-specs-row">
                        <span className="dp-specs-label">Measurements (mm) :</span>
                        <span className="dp-specs-value">{selectedProduct.frame_measurements}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      )}

      {/* ── YOU MAY ALSO LIKE ── */}
      <RelatedProducts
        relatedItems={dynamicRelated}
        onProductClick={handleRelatedProductClick}
      />

      {/* ── FOOTER ── */}
      <SiteFooter />

      {/* ── TOAST ── */}
      <Toast
        message={toastMsg}
        type={toastType}
        onClose={() => setToastMsg("")}
      />
    </div>
  );
}
