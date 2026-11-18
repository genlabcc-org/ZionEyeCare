import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { lensService } from "../../services/lensService";
import "./AddLens.css";

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
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${id}_${field}`];
      return next;
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!lensName.trim()) {
      nextErrors.lensName = "Lens name is required";
    }

    thicknesses.forEach((t) => {
      if (!String(t.name || "").trim()) {
        nextErrors[`${t.id}_name`] = "Thickness name is required";
      }
      if (!String(t.index || "").trim()) {
        nextErrors[`${t.id}_index`] = "Index is required";
      }
      if (!String(t.range || "").trim()) {
        nextErrors[`${t.id}_range`] = "Range is required";
      }
      if (t.basePrice === "" || t.basePrice === null || isNaN(Number(t.basePrice)) || Number(t.basePrice) < 0) {
        nextErrors[`${t.id}_basePrice`] = "Valid base price is required";
      }
      if (!String(t.bestSuitedFor || "").trim()) {
        nextErrors[`${t.id}_bestSuitedFor`] = "Best suited for is required";
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
      const payload = {
        name: lensName.trim(),
        is_active: isActive,
        thicknesses: thicknesses.map((t) => ({
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
                  <span className="al-thickness-badge">Thickness #{idx + 1}</span>
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
                    <label className="al-label">
                      Name <span className="al-req">*</span>
                    </label>
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
                    <label className="al-label">
                      Index <span className="al-req">*</span>
                    </label>
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
                    <label className="al-label">
                      Range <span className="al-req">*</span>
                    </label>
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
                    <label className="al-label">
                      Base Price (₹) <span className="al-req">*</span>
                    </label>
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
                    <label className="al-label">
                      Best Suited For <span className="al-req">*</span>
                    </label>
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
