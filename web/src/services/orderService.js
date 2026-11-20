import { supabase } from '../lib/supabase';
import { resolveThicknessPrice } from '../utils/lensUtils';

export const orderService = {
  /**
   * Retrieves all orders for a specific user.
   * @param {string} userId 
   * @returns {Promise<any[]>}
   */
  async getOrders(userId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      try {
        const orderIds = data.map((o) => o.id);
        const { data: allItems } = await supabase
          .from('order_items')
          .select('*, products(product_id, name, image_url, images, sku)')
          .in('order_id', orderIds);
        if (allItems && allItems.length > 0) {
          const itemsByOrderId = {};
          allItems.forEach((item) => {
            if (!item.image_url && item.products) {
              item.image_url = item.products.image_url || item.products.images?.[0] || null;
            }
            if ((!item.sku || item.sku === 'N/A') && item.products?.sku) {
              item.sku = item.products.sku;
            }
            if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
            itemsByOrderId[item.order_id].push(item);
          });
          data.forEach((o) => {
            const jsonItems = Array.isArray(o.items) ? o.items : [];
            if (itemsByOrderId[o.id]) {
              o.order_items = itemsByOrderId[o.id].map((it, idx) => {
                const matchedJson = jsonItems.find((ji) => String(ji.product_id || ji.productId) === String(it.product_id)) || jsonItems[idx] || {};
                const lensSelection = it.lens_selection || it.lensSelection || matchedJson.lens_selection || matchedJson.lensSelection || null;
                let lensAddonPrice = Number(it.lens_addon_price ?? it.lensAddonPrice ?? matchedJson.lens_addon_price ?? matchedJson.lensAddonPrice ?? lensSelection?.addonPrice ?? 0);
                if (lensAddonPrice <= 0 && lensSelection) {
                  lensAddonPrice = resolveThicknessPrice(lensSelection);
                }
                const unitPrice = Number(it.price || 0);
                let framePrice = Number(it.frame_price ?? it.framePrice ?? matchedJson.frame_price ?? matchedJson.framePrice ?? 0);
                if (framePrice <= 0 && unitPrice > 0) {
                  framePrice = Math.max(0, unitPrice - lensAddonPrice);
                }
                const finalLensSelection = lensSelection ? {
                  ...lensSelection,
                  addonPrice: lensAddonPrice
                } : null;
                return {
                  ...matchedJson,
                  ...it,
                  lensSelection: finalLensSelection,
                  lens_selection: finalLensSelection,
                  lensAddonPrice,
                  lens_addon_price: lensAddonPrice,
                  framePrice,
                  frame_price: framePrice,
                };
              });
            } else if (jsonItems.length > 0) {
              o.order_items = jsonItems;
            }
          });
        } else {
          data.forEach((o) => {
            if (Array.isArray(o.items) && o.items.length > 0) {
              o.order_items = o.items;
            }
          });
        }
      } catch (e) {
        console.warn('Error joining order_items in getOrders:', e);
      }
    }
    return data || [];
  },

  /**
   * Retrieves all addresses for a specific user.
   * @param {string} userId 
   * @returns {Promise<any[]>}
   */
  async getAddresses(userId) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Retrieves a single address by its ID (supports address_id or id).
   * @param {string|number} addressId 
   * @returns {Promise<any>}
   */
  async getAddressById(addressId) {
    if (!addressId) return null;
    try {
      // 1. Try matching by address_id
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('address_id', addressId)
        .maybeSingle();
      if (!error && data) return data;

      // 2. Try matching by id (uuid or numeric) if table has id column
      try {
        const { data: dataById, error: errById } = await supabase
          .from('addresses')
          .select('*')
          .eq('id', addressId)
          .maybeSingle();
        if (!errById && dataById) return dataById;
      } catch (_) {
        // 'id' column may not exist in all schemas (table uses address_id)
      }
    } catch (err) {
      console.warn('orderService.getAddressById error:', err);
    }
    return null;
  },

  /**
   * Creates a new address for a user.
   * @param {object} addressData 
   * @returns {Promise<any>}
   */
  async createAddress(addressData) {
    const { data, error } = await supabase
      .from('addresses')
      .insert(addressData)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Updates an existing address.
   * @param {string|number} addressId 
   * @param {object} addressData 
   * @returns {Promise<any>}
   */
  async updateAddress(addressId, addressData) {
    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('address_id', addressId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Deletes a specific address.
   * @param {string|number} addressId 
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async deleteAddress(addressId, userId) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('address_id', addressId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Resets default status for all user addresses to false.
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async resetAddressDefaults(userId) {
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Sets a specific address as the user's default address.
   * @param {string|number} addressId 
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async setAddressDefault(addressId, userId) {
    // 1. Reset all addresses to is_default = false
    await this.resetAddressDefaults(userId);

    // 2. Set this address to is_default = true
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('address_id', addressId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Retrieves all orders in the system (admin view).
   * @returns {Promise<any[]>}
   */
  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_date', { ascending: false });
    if (error) throw error;
    if (data && data.length > 0) {
      try {
        const orderIds = data.map((o) => o.id);
        const { data: allItems } = await supabase
          .from('order_items')
          .select('*, products(product_id, name, image_url, images, sku)')
          .in('order_id', orderIds);
        if (allItems && allItems.length > 0) {
          const itemsByOrderId = {};
          allItems.forEach((item) => {
            if (!item.image_url && item.products) {
              item.image_url = item.products.image_url || item.products.images?.[0] || null;
            }
            if ((!item.sku || item.sku === 'N/A') && item.products?.sku) {
              item.sku = item.products.sku;
            }
            if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
            itemsByOrderId[item.order_id].push(item);
          });
          data.forEach((o) => {
            const jsonItems = Array.isArray(o.items) ? o.items : [];
            if (itemsByOrderId[o.id]) {
              o.order_items = itemsByOrderId[o.id].map((it, idx) => {
                const matchedJson = jsonItems.find((ji) => String(ji.product_id || ji.productId) === String(it.product_id)) || jsonItems[idx] || {};
                const lensSelection = it.lens_selection || it.lensSelection || matchedJson.lens_selection || matchedJson.lensSelection || null;
                let lensAddonPrice = Number(it.lens_addon_price ?? it.lensAddonPrice ?? matchedJson.lens_addon_price ?? matchedJson.lensAddonPrice ?? lensSelection?.addonPrice ?? 0);
                if (lensAddonPrice <= 0 && lensSelection) {
                  lensAddonPrice = resolveThicknessPrice(lensSelection);
                }
                const unitPrice = Number(it.price || 0);
                let framePrice = Number(it.frame_price ?? it.framePrice ?? matchedJson.frame_price ?? matchedJson.framePrice ?? 0);
                if (framePrice <= 0 && unitPrice > 0) {
                  framePrice = Math.max(0, unitPrice - lensAddonPrice);
                }
                const finalLensSelection = lensSelection ? {
                  ...lensSelection,
                  addonPrice: lensAddonPrice
                } : null;
                return {
                  ...matchedJson,
                  ...it,
                  lensSelection: finalLensSelection,
                  lens_selection: finalLensSelection,
                  lensAddonPrice,
                  lens_addon_price: lensAddonPrice,
                  framePrice,
                  frame_price: framePrice,
                };
              });
            } else if (jsonItems.length > 0) {
              o.order_items = jsonItems;
            }
          });
        } else {
          data.forEach((o) => {
            if (Array.isArray(o.items) && o.items.length > 0) {
              o.order_items = o.items;
            }
          });
        }
      } catch (e) {
        console.warn('Error joining order_items in getAllOrders:', e);
      }

      // Batch join shipping addresses for all orders
      try {
        const addressIds = [...new Set(data.map((o) => o.address_id).filter(Boolean))];
        if (addressIds.length > 0) {
          const { data: addrs } = await supabase
            .from('addresses')
            .select('*')
            .in('address_id', addressIds);
          if (addrs && addrs.length > 0) {
            const addrMap = {};
            addrs.forEach((a) => {
              addrMap[String(a.address_id)] = a;
            });
            data.forEach((o) => {
              if (o.address_id && addrMap[String(o.address_id)]) {
                o.shipping_address = addrMap[String(o.address_id)];
                o.customer_phone = o.customer_phone || addrMap[String(o.address_id)].phone_number;
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error joining addresses in getAllOrders:', e);
      }
    }
    return data || [];
  },

  /**
   * Retrieves all customer records in the system (admin view).
   * @returns {Promise<any[]>}
   */
  async getAllCustomers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /**
   * Updates the status of a specific order.
   * @param {string} orderId 
   * @param {string} status 
   * @returns {Promise<any>}
   */
  async updateOrderStatus(orderId, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, delivery_status: status })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Updates the admin note for a specific order.
   * @param {string} orderId 
   * @param {string} note 
   * @returns {Promise<any>}
   */
  async updateOrderNote(orderId, note) {
    const { data, error } = await supabase
      .from('orders')
      .update({ admin_notes: note })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Cancels a specific order.
   * @param {string} orderId 
   * @returns {Promise<any>}
   */
  async cancelOrder(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'Cancelled', delivery_status: 'Cancelled' })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Marks an order's invoice as printed so it cannot be printed again.
   * @param {string} orderId
   * @returns {Promise<any>}
   */
  async markInvoicePrinted(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .update({ invoice_printed: true })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Marks multiple orders as printed in a single batch query.
   * @param {string[]} orderIds
   * @returns {Promise<any>}
   */
  async markInvoicesBulkPrinted(orderIds) {
    if (!orderIds || orderIds.length === 0) return [];
    const { data, error } = await supabase
      .from('orders')
      .update({ invoice_printed: true })
      .in('id', orderIds)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Updates the printed status of an order manually (Printed vs Unprinted).
   * @param {string} orderId
   * @param {boolean} printedStatus
   * @returns {Promise<any>}
   */
  async updateInvoicePrintedStatus(orderId, printedStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ invoice_printed: Boolean(printedStatus) })
      .eq('id', orderId)
      .select();
    if (error) throw error;
    return data;
  },

  /**
   * Retrieves a single order by ID with details.
   * @param {string} orderId 
   * @returns {Promise<any>}
   */
  async getOrderById(orderId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('*, products(product_id, name, image_url, images, sku)')
          .eq('order_id', orderId);
        const jsonItems = Array.isArray(data.items) ? data.items : [];
        if (items && items.length > 0) {
          data.order_items = items.map((it, idx) => {
            if (!it.image_url && it.products) {
              it.image_url = it.products.image_url || it.products.images?.[0] || null;
            }
            if ((!it.sku || it.sku === 'N/A') && it.products?.sku) {
              it.sku = it.products.sku;
            }
            const matchedJson = jsonItems.find((ji) => String(ji.product_id || ji.productId) === String(it.product_id)) || jsonItems[idx] || {};
            const lensSelection = it.lens_selection || it.lensSelection || matchedJson.lens_selection || matchedJson.lensSelection || null;
            let lensAddonPrice = Number(it.lens_addon_price ?? it.lensAddonPrice ?? matchedJson.lens_addon_price ?? matchedJson.lensAddonPrice ?? lensSelection?.addonPrice ?? 0);
            if (lensAddonPrice <= 0 && lensSelection) {
              lensAddonPrice = resolveThicknessPrice(lensSelection);
            }
            const unitPrice = Number(it.price || 0);
            let framePrice = Number(it.frame_price ?? it.framePrice ?? matchedJson.frame_price ?? matchedJson.framePrice ?? 0);
            if (framePrice <= 0 && unitPrice > 0) {
              framePrice = Math.max(0, unitPrice - lensAddonPrice);
            }
            const finalLensSelection = lensSelection ? {
              ...lensSelection,
              addonPrice: lensAddonPrice
            } : null;
            return {
              ...matchedJson,
              ...it,
              lensSelection: finalLensSelection,
              lens_selection: finalLensSelection,
              lensAddonPrice,
              lens_addon_price: lensAddonPrice,
              framePrice,
              frame_price: framePrice,
            };
          });
        } else if (jsonItems.length > 0) {
          data.order_items = jsonItems;
        }
      } catch (err) {
        console.warn('Error fetching order_items for getOrderById:', err);
      }
    }
    return data;
  }
};

