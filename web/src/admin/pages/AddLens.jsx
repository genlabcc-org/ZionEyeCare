import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { lensService } from "../../services/lensService";
import "./AddLens.css";

export const LENS_THICKNESS_PRESETS = [
  { name: "Standard", index: "1.56", range: "(from +2.00 to -2.00)", bestSuitedFor: "Low Powers" },
  { name: "Thin", index: "1.60", range: "(from +4.00 to -4.00)", bestSuitedFor: "Moderate Powers" },
  { name: "Super Thin", index: "1.67", range: "(from +6.00 to -6.00)", bestSuitedFor: "High Powers" },
  { name: "Ultra Thin", index: "1.74", range: "(for above +6.00 and below -6.00)", bestSuitedFor: "Very High Powers" },
];

const createEmptyThickness = () => ({
  id: `thick-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  name: "",
  index: "",
  range: "",
  basePrice: "",
  bestSuitedFor: "",
});

export default function AddLens({ initialData = null, onBack, onSave }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const queryLensId = searchParams.get("id") || location.state?.editingLensId || initialData?.id || null;

  const [lensName, setLensName] = useState(initialData?.name || "");
  const [isActive, setIsActive] = useState(
    initialData?.is_active !== undefined ? Boolean(initialData.is_active) : true
  );
  const [thicknesses, setThicknesses] = useState(() => {
    if (Array.isArray(initialData?.thicknesses) && initialData.thicknesses.length > 0) {
      return initialData.thicknesses.map((t, idx) => ({
        id: t.id || `thick-${idx}-${Date.now()}`,
        name: t.name || "",
        index: t.index ?? t.lens_index ?? "",
        range: t.range ?? t.power_range ?? "",
        basePrice: t.basePrice ?? t.base_price ?? "",
        bestSuitedFor: t.bestSuitedFor ?? t.best_suited_for ?? "",
      }));
    }
    return [createEmptyThickness()];
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Hydrate when editing by ID if initialData is not passed or doesn't match
  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (!queryLensId) return;
      if (initialData && String(initialData.id) === String(queryLensId)) {
        setLensName(initialData.name || "");
        setIsActive(initialData.is_active !== false);
        if (Array.isArray(initialData.thicknesses) && initialData.thicknesses.length > 0) {
          setThicknesses(
            initialData.thicknesses.map((t, idx) => ({
              id: t.id || `thick-${idx}-${Date.now()}`,
              name: t.name || "",
              index: t.index ?? t.lens_index ?? "",
              range: t.range ?? t.power_range ?? "",
              basePrice: t.basePrice ?? t.base_price ?? "",
              bestSuitedFor: t.bestSuitedFor ?? t.best_suited_for ?? "",
            }))
          );
        }
        return;
      }

      try {
        setLoadingInitial(true);
        const fetched = await lensService.getLensById(queryLensId);
        if (cancelled || !fetched) return;
        setLensName(fetched.name || "");
        setIsActive(fetched.is_active !== false);
        if (Array.isArray(fetched.thicknesses) && fetched.thicknesses.length > 0) {
          setThicknesses(
            fetched.thicknesses.map((t, idx) => ({
              id: t.id || `thick-${idx}-${Date.now()}`,
              name: t.name || "",
              index: t.index ?? t.lens_index ?? "",
              range: t.range ?? t.power_range ?? "",
              basePrice: t.basePrice ?? t.base_price ?? "",
              bestSuitedFor: t.bestSuitedFor ?? t.best_suited_for ?? "",
            }))
          );
        }
      } catch (err) {
        console.error("Error loading lens for edit:", err);
      } finally {
        if (!cancelled) setLoadingInitial(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [queryLensId, initialData]);

  // Listen to navbar Clear All event
  useEffect(() => {
    const handleClearAll = () => {
      setLensName("");
      setIsActive(true);
      setThicknesses([createEmptyThickness()]);
      setErrors({});
    };
    window.addEventListener("zion:clear-lens-form", handleClearAll);
    return () => window.removeEventListener("zion:clear-lens-form", handleClearAll);
  }, []);

  const handleAddThickness = () => {
    setThicknesses((prev) => [...prev, createEmptyThickness()]);
  };

  const handleRemoveThickness = (id) => {
    setThicknesses((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleThicknessChange = (id, field, value) => {
    setThicknesses((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        if (field === "index" && !t.name.trim()) {
          const val = String(value).trim();
          if (val === "1.56" || val === "1.5") updated.name = "Standard";
          else if (val === "1.60" || val === "1.6") updated.name = "Thin";
          else if (val === "1.67") updated.name = "Super Thin";
          else if (val === "1.74") updated.name = "Ultra Thin";
        }
        return updated;
      })
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${id}_${field}`];
      return next;
    });
  };

  const isThicknessRowEmpty = (t) =>
    !String(t.name || "").trim() &&
    !String(t.index || "").trim() &&
    !String(t.range || "").trim() &&
    !String(t.bestSuitedFor || "").trim() &&
    (t.basePrice === "" || t.basePrice === null || t.basePrice === 0);

  const validate = () => {
    const nextErrors = {};
    if (!lensName.trim()) {
      nextErrors.lensName = "Lens name is required";
    }

    // Only validate thickness rows that are at least partially filled
    thicknesses.forEach((t) => {
      if (isThicknessRowEmpty(t)) return; // skip fully empty rows
      // Partial fill: if any field is filled, require index (minimum)
      if (!String(t.index || "").trim()) {
        nextErrors[`${t.id}_index`] = "Index is required for this thickness";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      // Filter out completely empty thickness rows before saving
      const filledThicknesses = thicknesses.filter((t) => !isThicknessRowEmpty(t));
      const payload = {
        name: lensName.trim(),
        is_active: isActive,
        thicknesses: filledThicknesses.map((t) => ({
          name: String(t.name || "").trim(),
          index: String(t.index || "").trim(),
          range: String(t.range || "").trim(),
          basePrice: Number(t.basePrice) || 0,
          bestSuitedFor: String(t.bestSuitedFor || "").trim(),
        })),
      };

      const saved = queryLensId
        ? await lensService.updateLens(queryLensId, payload)
        : await lensService.createLens(payload);

      if (onSave) {
        onSave(saved);
      }
    } catch (err) {
      console.error("Failed to save lens:", err);
      alert("Failed to save lens: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="al-page">
        <div className="al-loading-state">
          <p className="al-loading-text">Loading lens details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="al-page">
      <form className="al-form" onSubmit={handleSubmit} noValidate>
        {/* Lens general details */}
        <section className="al-section al-section--details">
          <div className="al-card-header">
            <div>
              <h2 className="al-section-title">Lens Details</h2>
              <p className="al-section-sub">Enter the optical lens type name and status</p>
            </div>

            <label className="al-visibility-toggle">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="al-visibility-slider" />
              <span className="al-visibility-label">
                {isActive ? "Active on Store" : "Hidden"}
              </span>
            </label>
          </div>

          <div className="al-field">
            <label className="al-label" htmlFor="al-lens-name">
              Lens Name <span className="al-req">*</span>
            </label>
            <input
              id="al-lens-name"
              type="text"
              className={`al-input${errors.lensName ? " al-input--error" : ""}`}
              placeholder="e.g. Blue Cut Anti-Glare"
              value={lensName}
              onChange={(e) => {
                setLensName(e.target.value);
                if (errors.lensName) {
                  setErrors((prev) => ({ ...prev, lensName: undefined }));
                }
              }}
            />
            {errors.lensName && <span className="al-error-msg">{errors.lensName}</span>}
          </div>
        </section>

        {/* Thickness options */}
        <section className="al-thickness-section">
          <div className="al-thickness-list">
            {thicknesses.map((item, idx) => (
                <div key={item.id} className="al-thickness-row">
                <div className="al-thickness-box-top">
                  <div className="al-thickness-badge-wrap">
                    <span className="al-thickness-badge">Thickness #{idx + 1}</span>
                    {(() => {
                      const isCurrentFilled = Boolean(item.name?.trim() && item.index?.trim());
                      if (isCurrentFilled) return null;

                      const availablePresets = LENS_THICKNESS_PRESETS.filter(
                        (p) =>
                          !thicknesses.some(
                            (t) =>
                              t.id !== item.id &&
                              ((t.name || "").trim().toLowerCase() === p.name.toLowerCase() ||
                                (t.index || "").trim() === p.index)
                          )
                      );

                      if (availablePresets.length === 0) return null;

                      return (
                        <div className="al-preset-quick-pills">
                          {availablePresets.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              className="al-preset-quick-btn"
                              onClick={() => {
                                setThicknesses((prev) =>
                                  prev.map((t) =>
                                    t.id === item.id
                                      ? {
                                          ...t,
                                          name: p.name,
                                          index: p.index,
                                          range: p.range,
                                          bestSuitedFor: p.bestSuitedFor,
                                        }
                                      : t
                                  )
                                );
                                setErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[`${item.id}_name`];
                                  delete next[`${item.id}_index`];
                                  delete next[`${item.id}_range`];
                                  delete next[`${item.id}_bestSuitedFor`];
                                  return next;
                                });
                              }}
                              title={`Auto-fill ${p.name} (${p.index})`}
                            >
                              + {p.name} ({p.index})
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  {thicknesses.length > 1 && (
                    <button
                      type="button"
                      className="al-remove-thickness-btn"
                      onClick={() => handleRemoveThickness(item.id)}
                      title="Remove this thickness"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      Remove
                    </button>
                  )}
                </div>

                <div className="al-thickness-grid">
                  {/* 1. Thickness Name */}
                  <div className="al-field">
                    <label className="al-label">Name</label>
                    <input
                      type="text"
                      className={`al-input${errors[`${item.id}_name`] ? " al-input--error" : ""}`}
                      placeholder="e.g. Thin"
                      value={item.name}
                      onChange={(e) => handleThicknessChange(item.id, "name", e.target.value)}
                    />
                    {errors[`${item.id}_name`] && (
                      <span className="al-error-msg">{errors[`${item.id}_name`]}</span>
                    )}
                  </div>

                  {/* 2. Index */}
                  <div className="al-field">
                    <label className="al-label">Index</label>
                    <input
                      type="text"
                      className={`al-input${errors[`${item.id}_index`] ? " al-input--error" : ""}`}
                      placeholder="e.g. 1.60"
                      value={item.index}
                      onChange={(e) => handleThicknessChange(item.id, "index", e.target.value)}
                    />
                    {errors[`${item.id}_index`] && (
                      <span className="al-error-msg">{errors[`${item.id}_index`]}</span>
                    )}
                  </div>

                  {/* 3. Range */}
                  <div className="al-field">
                    <label className="al-label">Range</label>
                    <input
                      type="text"
                      className={`al-input${errors[`${item.id}_range`] ? " al-input--error" : ""}`}
                      placeholder="e.g. 0.00 to -4.00"
                      value={item.range}
                      onChange={(e) => handleThicknessChange(item.id, "range", e.target.value)}
                    />
                    {errors[`${item.id}_range`] && (
                      <span className="al-error-msg">{errors[`${item.id}_range`]}</span>
                    )}
                  </div>

                  {/* 4. Base Price */}
                  <div className="al-field">
                    <label className="al-label">Base Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`al-input${errors[`${item.id}_basePrice`] ? " al-input--error" : ""}`}
                      placeholder="0"
                      value={item.basePrice}
                      onChange={(e) => handleThicknessChange(item.id, "basePrice", e.target.value)}
                    />
                    {errors[`${item.id}_basePrice`] && (
                      <span className="al-error-msg">{errors[`${item.id}_basePrice`]}</span>
                    )}
                  </div>

                  {/* 5. Best Suited For */}
                  <div className="al-field al-field--full">
                    <label className="al-label">Best Suited For</label>
                    <input
                      type="text"
                      className={`al-input${errors[`${item.id}_bestSuitedFor`] ? " al-input--error" : ""}`}
                      placeholder="e.g. Mild to moderate power"
                      value={item.bestSuitedFor}
                      onChange={(e) => handleThicknessChange(item.id, "bestSuitedFor", e.target.value)}
                    />
                    {errors[`${item.id}_bestSuitedFor`] && (
                      <span className="al-error-msg">{errors[`${item.id}_bestSuitedFor`]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="al-bottom-add-row">
            <button
              type="button"
              className="al-add-another-btn"
              onClick={handleAddThickness}
            >
              + Add Another Thickness
            </button>
          </div>
        </section>

        {/* Footer Actions */}
        <div className="al-footer-actions">
          <button
            type="button"
            className="al-btn-cancel"
            onClick={onBack}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="al-btn-save"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : queryLensId
              ? "Update Lens"
              : "Save Lens"}
          </button>
        </div>
      </form>
    </div>
  );
}
