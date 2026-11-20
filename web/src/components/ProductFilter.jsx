import React, { useState, useEffect } from "react";
import "./ProductFilter.css";

export default function ProductFilter({
  sortBy = "featured",
  onSortChange,
  availableCategories = [],
  selectedCategories = [],
  onCategoryToggle,
  availableGenders = [],
  selectedGenders = [],
  onGenderToggle,
  availableSubcategories = [],
  selectedSubcategories = [],
  onSubcategoryToggle,
  availableFabrics = [],
  selectedFabrics = [],
  onFabricToggle,
  fabricCounts = {},
  availableSizes = [],
  selectedSizes = [],
  onSizeToggle,
  onClearFilters,
  className = "",
  // Mobile drawer controls
  mobileOpen = false,
  onMobileClose,
  totalCount,
}) {
  const activeCategories = selectedCategories;
  const handleCategoryClick = onCategoryToggle;

  // Accordion collapsed state
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Show more / less toggles for long lists
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllSubcategories, setShowAllSubcategories] = useState(false);
  const [showAllMaterials, setShowAllMaterials] = useState(false);

  // Normalize category objects: [{ name, count, id }]
  const categoryItems = (availableCategories || []).map((cat) => {
    if (typeof cat === "string") return { id: cat, name: cat, count: null };
    return { id: cat.id || cat.category_id || cat.name, name: cat.name, count: cat.count };
  });

  // Normalize subcategory objects: [{ name, count, id }]
  const subcategoryItems = (availableSubcategories || []).map((sub) => {
    if (typeof sub === "string") return { id: sub, name: sub, count: null };
    return { id: sub.id || sub.subcategory_id || sub.name, name: sub.name, count: sub.count };
  });

  // Normalize material/fabric objects: [{ name, count }]
  const materialItems = (availableFabrics || []).map((fab) => {
    if (typeof fab === "string") {
      return { name: fab, count: fabricCounts[fab] ?? null };
    }
    return { name: fab.name, count: fab.count ?? fabricCounts[fab.name] ?? null };
  });

  // Normalize size objects: [{ size, count }]
  const sizeItems = (availableSizes || []).map((s) => {
    if (typeof s === "object" && s !== null) {
      return { size: String(s.size || s.name || "").trim(), count: s.count };
    }
    return { size: String(s).trim(), count: null };
  }).filter((s) => s.size);

  const hasActiveFilters =
    sortBy !== "featured" ||
    activeCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedGenders.length > 0 ||
    selectedFabrics.length > 0 ||
    selectedSizes.length > 0;

  const activeCount =
    (sortBy !== "featured" ? 1 : 0) +
    activeCategories.length +
    selectedSubcategories.length +
    selectedGenders.length +
    selectedFabrics.length +
    selectedSizes.length;

  // Active filter chips list for quick dismissal
  const activeChips = [];
  if (sortBy === "price-low-high") {
    activeChips.push({ label: "Price: Low to High", onRemove: () => onSortChange && onSortChange("price-low-high") });
  } else if (sortBy === "price-high-low") {
    activeChips.push({ label: "Price: High to Low", onRemove: () => onSortChange && onSortChange("price-high-low") });
  }
  selectedCategories.forEach((cat) => {
    activeChips.push({ label: cat, onRemove: () => onCategoryToggle && onCategoryToggle(cat) });
  });
  selectedSubcategories.forEach((sub) => {
    activeChips.push({ label: sub, onRemove: () => onSubcategoryToggle && onSubcategoryToggle(sub) });
  });
  selectedGenders.forEach((gender) => {
    const gLabel = gender.charAt(0).toUpperCase() + gender.slice(1);
    activeChips.push({ label: gLabel, onRemove: () => onGenderToggle && onGenderToggle(gender) });
  });
  selectedFabrics.forEach((fab) => {
    activeChips.push({ label: fab, onRemove: () => onFabricToggle && onFabricToggle(fab) });
  });
  selectedSizes.forEach((size) => {
    activeChips.push({ label: `Size: ${size}`, onRemove: () => onSizeToggle && onSizeToggle(size) });
  });

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("filter-drawer-open");
    } else {
      document.body.classList.remove("filter-drawer-open");
    }
    return () => {
      document.body.classList.remove("filter-drawer-open");
    };
  }, [mobileOpen]);

  // Section Header helper
  const renderSectionHeader = (key, title, count = 0) => {
    const isCollapsed = !!collapsedSections[key];
    return (
      <button
        type="button"
        className="filter-heading-btn"
        onClick={() => toggleSection(key)}
        aria-expanded={!isCollapsed}
      >
        <span className="filter-heading-title">{title}</span>
        <div className="filter-heading-meta">
          {count > 0 && <span className="filter-heading-dot">{count}</span>}
          <svg
            className={`filter-heading-chevron ${isCollapsed ? "is-collapsed" : ""}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
    );
  };

  // Filter content
  const renderFilterSections = (isMobile = false) => (
    <div className="filter-groups-list">
      {/* ── Sort By ── */}
      <div className="filter-group">
        {renderSectionHeader("sort", "Sort By", sortBy !== "featured" ? 1 : 0)}
        {!collapsedSections["sort"] && (
          <div className="filter-group-body">
            <div className="filter-sort-options">
              {[
                { id: "price-low-high", label: "Price: Low to High" },
                { id: "price-high-low", label: "Price: High to Low" },
              ].map((opt) => {
                const isActive = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`filter-sort-option ${isActive ? "active" : ""}`}
                    onClick={() => onSortChange && onSortChange(opt.id)}
                  >
                    <span className="filter-radio-dot">
                      {isActive && <span className="filter-radio-dot-inner" />}
                    </span>
                    <span className="filter-sort-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Gender ── */}
      {availableGenders.length > 0 && (
        <div className="filter-group">
          {renderSectionHeader("gender", "Gender", selectedGenders.length)}
          {!collapsedSections["gender"] && (
            <div className="filter-group-body">
              <div className="filter-pill-grid">
                {availableGenders.map((gender) => {
                  const value = typeof gender === "string" ? gender : gender.value;
                  const label = typeof gender === "string" ? gender : gender.label;
                  const count = typeof gender === "string" ? null : gender.count;
                  const isChecked = selectedGenders.some(
                    (selected) => String(selected).toLowerCase() === String(value).toLowerCase()
                  );
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`filter-pill-tag ${isChecked ? "active" : ""}`}
                      onClick={() => onGenderToggle?.(value)}
                      aria-pressed={isChecked}
                    >
                      <span>{label}</span>
                      {count != null && <span className="filter-tag-count">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category ── */}
      {categoryItems.length > 0 && (
        <div className="filter-group">
          {renderSectionHeader("category", "Category", activeCategories.length)}
          {!collapsedSections["category"] && (
            <div className="filter-group-body">
              <div className="filter-options-list">
                {(showAllCategories ? categoryItems : categoryItems.slice(0, 6)).map((cat) => {
                  const isChecked = activeCategories.some(
                    (c) => String(c).toLowerCase() === String(cat.name).toLowerCase()
                  );
                  return (
                    <label key={cat.id || cat.name} className={`filter-item-row ${isChecked ? "active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCategoryClick && handleCategoryClick(cat.name)}
                      />
                      <span className="filter-custom-check">
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 3.5 6.5 9 1" />
                          </svg>
                        )}
                      </span>
                      <span className="filter-item-text">{cat.name}</span>
                      {cat.count != null && <span className="filter-item-count">{cat.count}</span>}
                    </label>
                  );
                })}
              </div>
              {categoryItems.length > 6 && (
                <button
                  type="button"
                  className="filter-toggle-more-btn"
                  onClick={() => setShowAllCategories((p) => !p)}
                >
                  {showAllCategories ? "Show Less" : `+ ${categoryItems.length - 6} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Subcategory ── */}
      {subcategoryItems.length > 0 && (
        <div className="filter-group">
          {renderSectionHeader("subcategory", "Subcategory", selectedSubcategories.length)}
          {!collapsedSections["subcategory"] && (
            <div className="filter-group-body">
              <div className="filter-options-list">
                {(showAllSubcategories ? subcategoryItems : subcategoryItems.slice(0, 6)).map((sub) => {
                  const isChecked = selectedSubcategories.some(
                    (s) => String(s).toLowerCase() === String(sub.name).toLowerCase()
                  );
                  return (
                    <label key={sub.id || sub.name} className={`filter-item-row ${isChecked ? "active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onSubcategoryToggle && onSubcategoryToggle(sub.name)}
                      />
                      <span className="filter-custom-check">
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 3.5 6.5 9 1" />
                          </svg>
                        )}
                      </span>
                      <span className="filter-item-text">{sub.name}</span>
                      {sub.count != null && <span className="filter-item-count">{sub.count}</span>}
                    </label>
                  );
                })}
              </div>
              {subcategoryItems.length > 6 && (
                <button
                  type="button"
                  className="filter-toggle-more-btn"
                  onClick={() => setShowAllSubcategories((p) => !p)}
                >
                  {showAllSubcategories ? "Show Less" : `+ ${subcategoryItems.length - 6} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Material (Frame Material) ── */}
      {materialItems.length > 0 && (
        <div className="filter-group">
          {renderSectionHeader("material", "Material", selectedFabrics.length)}
          {!collapsedSections["material"] && (
            <div className="filter-group-body">
              <div className="filter-options-list">
                {(showAllMaterials ? materialItems : materialItems.slice(0, 6)).map((mat) => {
                  const isChecked = selectedFabrics.some(
                    (f) => String(f).toLowerCase() === String(mat.name).toLowerCase()
                  );
                  return (
                    <label key={mat.name} className={`filter-item-row ${isChecked ? "active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onFabricToggle && onFabricToggle(mat.name)}
                      />
                      <span className="filter-custom-check">
                        {isChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 4 3.5 6.5 9 1" />
                          </svg>
                        )}
                      </span>
                      <span className="filter-item-text">{mat.name}</span>
                      {mat.count != null && <span className="filter-item-count">{mat.count}</span>}
                    </label>
                  );
                })}
              </div>
              {materialItems.length > 6 && (
                <button
                  type="button"
                  className="filter-toggle-more-btn"
                  onClick={() => setShowAllMaterials((p) => !p)}
                >
                  {showAllMaterials ? "Show Less" : `+ ${materialItems.length - 6} more`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Frame Size ── */}
      {sizeItems.length > 0 && (
        <div className="filter-group">
          {renderSectionHeader("size", "Size", selectedSizes.length)}
          {!collapsedSections["size"] && (
            <div className="filter-group-body">
              <div className="filter-size-grid">
                {sizeItems.map((item) => {
                  const isChecked = selectedSizes.some(
                    (s) => String(s).toLowerCase() === String(item.size).toLowerCase()
                  );
                  return (
                    <button
                      type="button"
                      key={item.size}
                      className={`filter-size-chip ${isChecked ? "active" : ""}`}
                      onClick={() => onSizeToggle && onSizeToggle(item.size)}
                      aria-pressed={isChecked}
                    >
                      <span className="size-chip-text">{item.size}</span>
                      {item.count != null && (
                        <span className="size-chip-count">{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ─── Desktop Left Sidebar ─── */}
      <aside
        className={`trending-sidebar product-filter-sidebar desktop-filter-sidebar ${className}`}
        aria-label="Product filters"
      >
        <div className="product-filter-header">
          <div className="product-filter-title-wrap">
            <span className="product-filter-main-title">Filters</span>
            {activeCount > 0 && (
              <span className="product-filter-active-pill">{activeCount}</span>
            )}
          </div>
          {hasActiveFilters && onClearFilters && (
            <button
              type="button"
              className="product-filter-clear-btn"
              onClick={onClearFilters}
            >
              Reset
            </button>
          )}
        </div>

        {/* Active Filter Chips (Desktop) */}
        {activeChips.length > 0 && (
          <div className="filter-active-chips-sidebar">
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="filter-sidebar-chip"
                onClick={chip.onRemove}
                title={`Remove ${chip.label}`}
              >
                <span>{chip.label}</span>
                <span className="chip-x">✕</span>
              </button>
            ))}
          </div>
        )}

        {renderFilterSections(false)}
      </aside>

      {/* ─── Mobile Slide-Up Filter Drawer Modal ─── */}
      {mobileOpen && (
        <div
          className="mobile-filter-drawer-overlay"
          onClick={onMobileClose}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="mobile-filter-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="mobile-drawer-handle-bar">
              <div className="mobile-drawer-handle"></div>
            </div>

            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-title-wrap">
                <h2 className="mobile-drawer-title">Filter & Sort</h2>
                {activeCount > 0 && (
                  <span className="mobile-drawer-active-count">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                className="mobile-drawer-close-btn"
                onClick={onMobileClose}
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            {/* Active Chips in Drawer */}
            {activeChips.length > 0 && (
              <div className="mobile-drawer-chips-bar">
                {activeChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="filter-sidebar-chip"
                    onClick={chip.onRemove}
                    title={`Remove ${chip.label}`}
                  >
                    <span>{chip.label}</span>
                    <span className="chip-x">✕</span>
                  </button>
                ))}
              </div>
            )}

            {/* Drawer Body (Scrollable) */}
            <div className="mobile-drawer-body">
              {renderFilterSections(true)}
            </div>

            {/* Drawer Sticky Footer */}
            <div className="mobile-drawer-footer">
              {hasActiveFilters && onClearFilters && (
                <button
                  type="button"
                  className="mobile-drawer-clear-btn"
                  onClick={onClearFilters}
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                className="mobile-drawer-apply-btn"
                onClick={onMobileClose}
              >
                {typeof totalCount === "number"
                  ? `View ${totalCount} ${totalCount === 1 ? "Product" : "Products"}`
                  : "Apply Filters"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
