import { supabase } from "../lib/supabase";

export const lensService = {
  /**
   * Fetch all lenses along with their thickness options
   */
  async getLenses() {
    const { data, error } = await supabase
      .from("lenses")
      .select("*, lens_thicknesses(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((lens) => {
      const relationalThicknesses = Array.isArray(lens.lens_thicknesses)
        ? [...lens.lens_thicknesses].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? 0) - (b.id ?? 0))
        : [];
      const fallbackThicknesses = Array.isArray(lens.thicknesses) ? lens.thicknesses : [];
      const rawList = relationalThicknesses.length > 0 ? relationalThicknesses : fallbackThicknesses;

      return {
        ...lens,
        thicknesses: rawList.map((t, idx) => ({
          id: t.id || `t-${idx}`,
          name: t.name || "",
          index: t.lens_index ?? t.index ?? "",
          lens_index: t.lens_index ?? t.index ?? "",
          range: t.power_range ?? t.range ?? "",
          power_range: t.power_range ?? t.range ?? "",
          basePrice: Number(t.base_price ?? t.basePrice ?? 0),
          base_price: Number(t.base_price ?? t.basePrice ?? 0),
          bestSuitedFor: t.best_suited_for ?? t.bestSuitedFor ?? "",
          best_suited_for: t.best_suited_for ?? t.bestSuitedFor ?? "",
          sort_order: t.sort_order ?? idx,
        })),
      };
    });
  },

  /**
   * Fetch a single lens by ID
   */
  async getLensById(id) {
    const { data, error } = await supabase
      .from("lenses")
      .select("*, lens_thicknesses(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    const relationalThicknesses = Array.isArray(data?.lens_thicknesses)
      ? [...data.lens_thicknesses].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? 0) - (b.id ?? 0))
      : [];
    const rawList = relationalThicknesses.length > 0 ? relationalThicknesses : (Array.isArray(data?.thicknesses) ? data.thicknesses : []);

    return {
      ...data,
      thicknesses: rawList.map((t, idx) => ({
        id: t.id || `t-${idx}`,
        name: t.name || "",
        index: t.lens_index ?? t.index ?? "",
        lens_index: t.lens_index ?? t.index ?? "",
        range: t.power_range ?? t.range ?? "",
        power_range: t.power_range ?? t.range ?? "",
        basePrice: Number(t.base_price ?? t.basePrice ?? 0),
        base_price: Number(t.base_price ?? t.basePrice ?? 0),
        bestSuitedFor: t.best_suited_for ?? t.bestSuitedFor ?? "",
        best_suited_for: t.best_suited_for ?? t.bestSuitedFor ?? "",
        sort_order: t.sort_order ?? idx,
      })),
    };
  },

  /**
   * Create a new lens with multiple thicknesses
   */
  async createLens({ name, is_active = true, thicknesses = [] }) {
    const normalizedThicknesses = thicknesses.map((t, idx) => ({
      name: String(t.name || "").trim(),
      lens_index: String(t.index ?? t.lens_index ?? "").trim(),
      power_range: String(t.range ?? t.power_range ?? "").trim(),
      base_price: Number(t.basePrice ?? t.base_price ?? 0) || 0,
      best_suited_for: String(t.bestSuitedFor ?? t.best_suited_for ?? "").trim(),
      sort_order: idx,
    }));

    const { data: createdLens, error: lensError } = await supabase
      .from("lenses")
      .insert({
        name: String(name || "").trim(),
        is_active: Boolean(is_active),
        thicknesses: normalizedThicknesses,
      })
      .select()
      .single();

    if (lensError) throw lensError;

    if (normalizedThicknesses.length > 0) {
      const rowsToInsert = normalizedThicknesses.map((t) => ({
        ...t,
        lens_id: createdLens.id,
      }));
      const { error: thickError } = await supabase
        .from("lens_thicknesses")
        .insert(rowsToInsert);
      if (thickError) throw thickError;
    }

    return this.getLensById(createdLens.id);
  },

  /**
   * Update an existing lens and replace its thicknesses
   */
  async updateLens(id, { name, is_active = true, thicknesses = [] }) {
    const normalizedThicknesses = thicknesses.map((t, idx) => ({
      name: String(t.name || "").trim(),
      lens_index: String(t.index ?? t.lens_index ?? "").trim(),
      power_range: String(t.range ?? t.power_range ?? "").trim(),
      base_price: Number(t.basePrice ?? t.base_price ?? 0) || 0,
      best_suited_for: String(t.bestSuitedFor ?? t.best_suited_for ?? "").trim(),
      sort_order: idx,
    }));

    const { error: lensError } = await supabase
      .from("lenses")
      .update({
        name: String(name || "").trim(),
        is_active: Boolean(is_active),
        thicknesses: normalizedThicknesses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (lensError) throw lensError;

    const { error: deleteError } = await supabase
      .from("lens_thicknesses")
      .delete()
      .eq("lens_id", id);

    if (deleteError) throw deleteError;

    if (normalizedThicknesses.length > 0) {
      const rowsToInsert = normalizedThicknesses.map((t) => ({
        ...t,
        lens_id: id,
      }));
      const { error: insertError } = await supabase
        .from("lens_thicknesses")
        .insert(rowsToInsert);
      if (insertError) throw insertError;
    }

    return this.getLensById(id);
  },

  /**
   * Toggle lens active status
   */
  async toggleLensStatus(id, is_active) {
    const { data, error } = await supabase
      .from("lenses")
      .update({
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a lens (cascades to lens_thicknesses)
   */
  async deleteLens(id) {
    const { error } = await supabase
      .from("lenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },
};
