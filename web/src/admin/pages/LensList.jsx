import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./LensList.css";
import editIcon from "../../assets/admin/Edit.png";
import trashIcon from "../../assets/admin/Trash.png";

export const resolveThicknessTypeName = (tier) => {
  const name = String(tier?.name || "").trim();
  const index = String(tier?.index || tier?.lens_index || "").trim();

  // If a descriptive custom name is present and not just an auto ID or index
  if (name && !name.toLowerCase().startsWith("thick-") && name !== index) {
    return name;
  }

  // Optical standards by index
  if (index.includes("1.74")) return "Ultra Thin";
  if (index.includes("1.67")) return "Super Thin";
  if (index.includes("1.60") || index === "1.6") return "Thin";
  if (index.includes("1.56")) return "Standard";
  if (index.includes("1.50") || index === "1.5") return "Standard";

  // Fallback by power range
  const range = String(tier?.range || tier?.power_range || "").toLowerCase();
  if (range.includes("above +6") || range.includes("below -6")) return "Ultra Thin";
  if (range.includes("+6.00") || range.includes("-6.00")) return "Super Thin";
  if (range.includes("+4.00") || range.includes("-4.00")) return "Thin";
  if (range.includes("+2.00") || range.includes("-2.00")) return "Standard";

  return name || "Standard";
};

export default function LensList({ lenses = [], loading = false, onEditLens, onDeleteLens, onToggleStatus }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const filteredLenses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return lenses;
    return lenses.filter((lens) => {
      if (String(lens.name || "").toLowerCase().includes(query)) return true;
      return (lens.thicknesses || []).some((tier) =>
        [
          resolveThicknessTypeName(tier),
          tier.name,
          tier.index || tier.lens_index,
          tier.range || tier.power_range,
          tier.bestSuitedFor || tier.best_suited_for,
        ].some((value) => String(value || "").toLowerCase().includes(query))
      );
    });
  }, [lenses, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteLens) return;
    try {
      setDeleting(true);
      await onDeleteLens(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete lens:", error);
      alert(`Failed to delete lens: ${error.message || "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (lens) => {
    if (!onToggleStatus) return;
    try {
      setTogglingId(lens.id);
      await onToggleStatus(lens.id, lens.is_active === false);
    } catch (error) {
      console.error("Failed to toggle lens status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="ll-page">
      <div className="ll-toolbar">
        <div className="ll-search-wrap">
          <svg className="ll-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input className="ll-search-input" placeholder="Search lenses, thickness, index, range..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          {searchQuery && <button type="button" className="ll-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">×</button>}
        </div>
      </div>

      {loading ? <div className="ll-empty-card"><div className="ll-spinner" /><p className="ll-empty-title">Loading lenses...</p></div>
        : filteredLenses.length === 0 ? <div className="ll-empty-card"><div className="ll-empty-icon">⌕</div><h3 className="ll-empty-title">{searchQuery ? "No matching lenses found" : "No lenses added yet"}</h3><p className="ll-empty-desc">{searchQuery ? "Try a different search keyword or clear the filter." : "Use Add Lens in the page header to create your first lens."}</p></div>
        : <div className="ll-list-wrap"><table className="ll-list-table"><thead><tr><th>Lens Name</th><th>Thickness &amp; Power Range</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filteredLenses.map((lens) => {
            const thicknesses = Array.isArray(lens.thicknesses) ? lens.thicknesses : [];
            const isActive = lens.is_active !== false;
            return <tr key={lens.id} className={!isActive ? "ll-list-row--inactive" : ""}>
              <td className="ll-list-name">{lens.name}</td>
              <td className="ll-list-detail">
                {thicknesses.length === 0 ? (
                  "—"
                ) : (
                  <div className="ll-thickness-pills">
                    {thicknesses.map((tier, idx) => {
                      const type = resolveThicknessTypeName(tier);
                      const index = tier.index || tier.lens_index || "";
                      const range = tier.range || tier.power_range || "";
                      return (
                        <div key={tier.id || idx} className="ll-thickness-pill">
                          <strong className="ll-tier-name">{type}</strong>
                          <span className="ll-tier-meta">
                            {index} {range}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </td>
              <td><span className={`ll-status-badge ${isActive ? "ll-status-badge--active" : "ll-status-badge--inactive"}`}>{isActive ? "Active" : "Inactive"}</span></td>
              <td><div className="ll-list-actions"><label className="ll-switch" title={isActive ? "Hide lens" : "Activate lens"}><input type="checkbox" checked={isActive} disabled={togglingId === lens.id} onChange={() => handleToggle(lens)} /><span className="ll-switch-slider" /></label><button type="button" className="ll-action-btn ll-action-btn--edit" onClick={() => onEditLens?.(lens)} aria-label={`Edit ${lens.name}`} title="Edit"><img src={editIcon} alt="" /></button><button type="button" className="ll-action-btn ll-action-btn--delete" onClick={() => setDeleteTarget(lens)} aria-label={`Delete ${lens.name}`} title="Delete"><img src={trashIcon} alt="" /></button></div></td>
            </tr>;
          })}
        </tbody></table></div>}

      {deleteTarget && typeof document !== "undefined" && createPortal(<div className="ll-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}><div className="ll-modal" onClick={(event) => event.stopPropagation()}><h3 className="ll-modal-title">Delete Lens</h3><p className="ll-modal-text">Are you sure you want to delete <strong>{deleteTarget.name}</strong> and all of its thickness options? This action cannot be undone.</p><div className="ll-modal-actions"><button type="button" className="ll-modal-cancel" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="ll-modal-confirm" disabled={deleting} onClick={handleConfirmDelete}>{deleting ? "Deleting..." : "Delete Lens"}</button></div></div></div>, document.body)}
    </div>
  );
}
