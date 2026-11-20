/**
 * Optical lens utility helpers for Zion EyeCare
 */

/**
 * Resolves the price for an optical lens.
 * 1. If an explicit non-zero addonPrice / basePrice is present (> 0), it is respected.
 * 2. If 0 or not specified, standard optical pricing is applied:
 *    - Ultra Thin (1.74): ₹2,500
 *    - Super Thin (1.67): ₹1,800
 *    - Thin (1.60): ₹1,000
 *    - Bifocal / Progressive: ₹1,500
 *    - Computer / Blue Block / Zero Power: ₹800
 *    - Single Vision / Standard (1.56): ₹500
 *    - Any other selected lens: ₹500
 *    - If no lens selected: ₹0
 *
 * @param {object|null} tier - The lens tier or lensSelection object
 * @param {object|null} catalogTier - Optional catalog thickness tier
 * @returns {number}
 */
export const resolveThicknessPrice = (tier, catalogTier = null) => {
  if (!tier && !catalogTier) return 0;

  // 1. Check explicit non-zero price
  const tierPrice =
    tier?.addonPrice ??
    tier?.basePrice ??
    tier?.base_price ??
    tier?.price ??
    tier?.lensAddonPrice ??
    tier?.lens_addon_price;
  const numTierPrice = Number(tierPrice);
  if (!isNaN(numTierPrice) && numTierPrice > 0) {
    return numTierPrice;
  }

  const catalogPrice = catalogTier?.basePrice ?? catalogTier?.base_price ?? catalogTier?.addonPrice;
  const numCatalogPrice = Number(catalogPrice);
  if (!isNaN(numCatalogPrice) && numCatalogPrice > 0) {
    return numCatalogPrice;
  }

  // 2. Fallback by index, thickness, or lens name
  const text = String(
    tier?.thicknessName ||
    tier?.name ||
    tier?.lensName ||
    tier?.visionType ||
    tier?.index ||
    tier?.lens_index ||
    catalogTier?.name ||
    catalogTier?.index ||
    catalogTier?.lens_index ||
    ""
  ).toLowerCase();

  if (!text.trim()) return 0;

  if (text.includes("1.74") || text.includes("ultra")) return 2500;
  if (text.includes("1.67") || text.includes("super")) return 1800;
  if (text.includes("1.60") || text.includes("1.6") || text.includes("thin")) return 1000;
  if (text.includes("progressive") || text.includes("bifocal")) return 1500;
  if (text.includes("computer") || text.includes("blue") || text.includes("zero power")) return 800;
  if (text.includes("single vision") || text.includes("standard") || text.includes("1.56") || text.includes("1.5")) return 500;

  // If a lens selection exists but didn't match known keywords, standard optical fee:
  return 500;
};
