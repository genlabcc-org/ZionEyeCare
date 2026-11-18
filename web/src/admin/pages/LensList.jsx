import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./LensList.css";
import editIcon from "../../assets/admin/Edit.png";
import trashIcon from "../../assets/admin/Trash.png";

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
        [tier.name, tier.index || tier.lens_index, tier.range || tier.power_range, tier.bestSuitedFor || tier.best_suited_for]
          .some((value) => String(value || "").toLowerCase().includes(query))
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
        : <div className="ll-list-wrap"><table className="ll-list-table"><thead><tr><th>Lens Name</th><th>Thickness Options</th><th>Index &amp; Range</th><th>Base Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filteredLenses.map((lens) => {
            const thicknesses = Array.isArray(lens.thicknesses) ? lens.thicknesses : [];
            const isActive = lens.is_active !== false;
            const prices = thicknesses.map((tier) => Number(tier.basePrice ?? tier.base_price ?? 0)).filter(Number.isFinite);
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;
            const detail = thicknesses.map((tier) => `${tier.index || tier.lens_index || "—"} · ${tier.range || tier.power_range || "—"}`).join(", ");
            return <tr key={lens.id} className={!isActive ? "ll-list-row--inactive" : ""}>
              <td className="ll-list-name">{lens.name}</td><td>{thicknesses.length} {thicknesses.length === 1 ? "option" : "options"}</td><td className="ll-list-detail">{detail || "—"}</td><td className="ll-list-price">₹{minPrice.toLocaleString("en-IN")}{maxPrice !== minPrice ? ` – ₹${maxPrice.toLocaleString("en-IN")}` : ""}</td>
              <td><span className={`ll-status-badge ${isActive ? "ll-status-badge--active" : "ll-status-badge--inactive"}`}>{isActive ? "Active" : "Inactive"}</span></td>
              <td><div className="ll-list-actions"><label className="ll-switch" title={isActive ? "Hide lens" : "Activate lens"}><input type="checkbox" checked={isActive} disabled={togglingId === lens.id} onChange={() => handleToggle(lens)} /><span className="ll-switch-slider" /></label><button type="button" className="ll-action-btn ll-action-btn--edit" onClick={() => onEditLens?.(lens)} aria-label={`Edit ${lens.name}`} title="Edit"><img src={editIcon} alt="" /></button><button type="button" className="ll-action-btn ll-action-btn--delete" onClick={() => setDeleteTarget(lens)} aria-label={`Delete ${lens.name}`} title="Delete"><img src={trashIcon} alt="" /></button></div></td>
            </tr>;
          })}
        </tbody></table></div>}

      {deleteTarget && typeof document !== "undefined" && createPortal(<div className="ll-modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}><div className="ll-modal" onClick={(event) => event.stopPropagation()}><h3 className="ll-modal-title">Delete Lens</h3><p className="ll-modal-text">Are you sure you want to delete <strong>{deleteTarget.name}</strong> and all of its thickness options? This action cannot be undone.</p><div className="ll-modal-actions"><button type="button" className="ll-modal-cancel" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancel</button><button type="button" className="ll-modal-confirm" disabled={deleting} onClick={handleConfirmDelete}>{deleting ? "Deleting..." : "Delete Lens"}</button></div></div></div>, document.body)}
    </div>
  );
}
