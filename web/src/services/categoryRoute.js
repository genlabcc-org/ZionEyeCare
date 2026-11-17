// Shared helper so every page's nav-link handler routes consistently.
//
// All categories route dynamically via their slug (e.g. "/category/eyeglasses", "/category/lenses")
// based on the database categories list.

/**
 * @param {string} link - the nav link label clicked (e.g. "Bangles", "Gold Chains", "Home")
 * @param {Array<{name: string, slug: string}>} categories - categories from the store
 * @returns {string} the path to navigate to
 */
export function getNavPath(link, categories = [], subcategory = null) {
  if (!link) return "/";
  if (link === "Home") return "/";

  const lower = String(link).toLowerCase().trim();
  if (lower === "about" || lower === "about us" || lower === "about zion eye care") return "/about";
  if (lower === "contact" || lower === "contact us") return "/contact";
  if (lower === "faq" || lower === "faqs") return "/#faq";
  if (lower === "all products" || lower === "shop") return "/all-products";

  // Look up slug from the store's category list
  const match = categories.find(
    (c) => (c.name || "").toLowerCase() === link.toLowerCase()
  );

  let basePath;
  if (match?.slug) {
    basePath = `/category/${match.slug}`;
  } else {
    // Fallback: slugify the name on the fly if no slug field was found,
    // so navigation doesn't silently break even if data is incomplete
    const fallbackSlug = link
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    basePath = `/category/${fallbackSlug}`;
  }

  if (subcategory && String(subcategory).trim()) {
    return `${basePath}?sub=${encodeURIComponent(String(subcategory).trim())}`;
  }

  return basePath;
}
