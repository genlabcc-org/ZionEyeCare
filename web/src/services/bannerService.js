import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompression';

/**
 * Check if a URL or File represents a video
 * @param {string|File} url 
 * @returns {boolean}
 */
export const isVideoMedia = (url) => {
  if (!url) return false;
  if (typeof url === 'object' && url.type) {
    return url.type.startsWith('video/');
  }
  return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(String(url)) || String(url).includes('video');
};

export const bannerService = {
  /**
   * Fetch all banners from Supabase banners table
   * @returns {Promise<any[]>}
   */
  async getBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching banners:', error);
        return [];
      }
      return (data || []).map((b) => ({
        ...b,
        id: b.id ?? b.banner_id ?? b._id,
      }));
    } catch (err) {
      console.error('Unexpected error fetching banners:', err);
      return [];
    }
  },

  /**
   * Fetch the active hero video or media for the homepage
   * Queries Supabase banners and returns the active video (from Cloudflare R2)
   * @returns {Promise<{ url: string, mobileUrl?: string, linkUrl?: string, isVideo: boolean, banner?: any } | null>}
   */
  async getHeroVideo() {
    try {
      const banners = await this.getBanners();
      if (!banners || banners.length === 0) return null;

      // 1. Look for active video banner
      const videoBanner = banners.find(
        (b) =>
          b.is_active !== false &&
          (isVideoMedia(b.video_url) || isVideoMedia(b.image_url) || isVideoMedia(b.mobile_url))
      );

      if (videoBanner) {
        const url = videoBanner.video_url || videoBanner.image_url;
        return {
          id: videoBanner.id,
          url,
          mobileUrl: videoBanner.mobile_url,
          linkUrl: videoBanner.link_url,
          isVideo: true,
          banner: videoBanner,
        };
      }

      // 2. Otherwise return the latest active banner
      const activeBanner = banners.find((b) => b.is_active !== false) || banners[0];
      if (activeBanner) {
        const url = activeBanner.video_url || activeBanner.image_url;
        return {
          id: activeBanner.id,
          url,
          mobileUrl: activeBanner.mobile_url,
          linkUrl: activeBanner.link_url,
          isVideo: isVideoMedia(url),
          banner: activeBanner,
        };
      }

      return null;
    } catch (err) {
      console.error('Error in getHeroVideo:', err);
      return null;
    }
  },

  /**
   * Upload media file (image or video) to Cloudflare R2 under banners/ folder
   * Images are compressed; video files are uploaded directly
   * @param {File} file 
   * @returns {Promise<{ filePath: string, publicUrl: string }>}
   */
  async uploadBannerImage(file) {
    let uploadFile = file;

    // 1. Compress image before upload only if it is an image
    if (file?.type && file.type.startsWith('image/')) {
      try {
        uploadFile = await compressImage(file, 'banner');
      } catch (e) {
        console.warn('Image compression fallback to original:', e);
        uploadFile = file;
      }
    }

    const cleanName = (uploadFile?.name || file?.name || 'banner').replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `banners/${Date.now()}-${cleanName}`;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('filePath', filePath);
    formData.append('cacheControl', '31536000');

    const { data, error } = await supabase.functions.invoke('upload-image', {
      body: formData,
    });

    if (error) {
      console.error('Cloudflare media upload error:', error);
      throw error;
    }

    const publicUrl = `${import.meta.env.VITE_R2_PUBLIC_URL}/${filePath}`;
    return { filePath, publicUrl, data };
  },

  // Alias for uploadBannerImage to support both names
  async uploadBannerMedia(file) {
    return this.uploadBannerImage(file);
  },

  /**
   * Create banner record in Supabase banners table
   * @param {Object} bannerData 
   * @returns {Promise<any>}
   */
  async createBanner({ imageUrl, mobileUrl, linkUrl }) {
    const record = {
      image_url: imageUrl || '',
      mobile_url: mobileUrl || null,
      link_url: linkUrl ? linkUrl.trim() : null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('banners')
      .insert([record])
      .select();

    if (error) {
      console.error('Error creating banner in Supabase:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Supabase RLS Policy Error: Please run the SQL policy setup in your Supabase SQL Editor to allow banner inserts.');
      }
      throw error;
    }
    const created = data?.[0] || record;
    return { ...created, id: created.id ?? created.banner_id };
  },

  /**
   * Update banner record in Supabase banners table
   * @param {string|number} id 
   * @param {Object} bannerData 
   * @returns {Promise<any>}
   */
  async updateBanner(id, { imageUrl, mobileUrl, linkUrl }) {
    // 1. Fetch current banner to find old image URLs
    let existingBanner = null;
    try {
      const { data: bData } = await supabase
        .from('banners')
        .select('image_url, mobile_url, link_url')
        .or(`banner_id.eq.${id},id.eq.${id}`)
        .maybeSingle();
      existingBanner = bData;
    } catch (e) {
      console.warn("Could not fetch existing banner:", e);
    }

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (imageUrl !== undefined) {
      updates.image_url = imageUrl || '';
    }
    if (mobileUrl !== undefined) {
      updates.mobile_url = mobileUrl || null;
    }
    if (linkUrl !== undefined) {
      updates.link_url = linkUrl ? linkUrl.trim() : null;
    }

    // Try updating using 'banner_id' column first
    let { data, error } = await supabase
      .from('banners')
      .update(updates)
      .eq('banner_id', id)
      .select();

    // Fallback to 'id' column if 'banner_id' column matches 0 rows or errors
    if ((error && error.message?.includes("'banner_id'")) || (!error && (!data || data.length === 0))) {
      const res = await supabase
        .from('banners')
        .update(updates)
        .eq('id', id)
        .select();

      if (!res.error && res.data && res.data.length > 0) {
        data = res.data;
        error = null;
      }
    }

    if (error) {
      console.error('Error updating banner in Supabase:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Supabase RLS Policy Error: Please run the SQL policy setup in your Supabase SQL Editor to allow banner updates.');
      }
      throw error;
    }

    // 2. Delete old desktop image from Cloudflare R2 if replaced or removed
    if (existingBanner?.image_url && imageUrl !== undefined && existingBanner.image_url !== imageUrl) {
      await this.deleteCloudflareImage(existingBanner.image_url);
    }

    // 3. Delete old mobile image from Cloudflare R2 if replaced or removed
    if (existingBanner?.mobile_url && mobileUrl !== undefined && existingBanner.mobile_url !== mobileUrl) {
      await this.deleteCloudflareImage(existingBanner.mobile_url);
    }

    const updated = data?.[0] || { banner_id: id, id, ...updates };
    return { ...updated, id: updated.banner_id ?? updated.id ?? id };
  },

  /**
   * Delete image file from Cloudflare R2 via upload-image edge function
   * @param {string} url 
   */
  async deleteCloudflareImage(url) {
    if (!url || typeof url !== 'string') return;
    
    // Extract relative filePath (e.g. banners/1788932483503-HomeImage.webp)
    let filePath = null;
    const match = url.match(/(?:banners|categories|products|subcategories)\/[^?#]+/);
    if (match) {
      filePath = match[0];
    } else {
      try {
        const parsed = new URL(url);
        filePath = parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
      } catch (e) {
        filePath = null;
      }
    }

    if (!filePath) return;
    filePath = filePath.split('?')[0].split('#')[0];

    try {
      await supabase.functions.invoke('upload-image', {
        method: 'DELETE',
        body: { filePath },
      });
    } catch (err) {
      console.warn('Failed to delete image from Cloudflare R2:', filePath, err);
    }
  },

  /**
   * Delete banner record from Supabase banners table and remove images from Cloudflare R2
   * @param {string|number} id 
   * @returns {Promise<boolean>}
   */
  async deleteBanner(id) {
    // 1. Retrieve existing banner to get image_url and mobile_url before deletion
    let { data: existingBanners } = await supabase
      .from('banners')
      .select('*')
      .eq('banner_id', id);

    if (!existingBanners || existingBanners.length === 0) {
      const res = await supabase
        .from('banners')
        .select('*')
        .eq('id', id);
      existingBanners = res.data;
    }

    const bannerToDelete = existingBanners?.[0];

    // 2. Delete banner record from Supabase table
    let { error } = await supabase
      .from('banners')
      .delete()
      .eq('banner_id', id);

    if (error && error.message?.includes("'banner_id'")) {
      const res = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      error = res.error;
    }

    if (error) {
      console.error('Error deleting banner from Supabase:', error);
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        throw new Error('Supabase RLS Policy Error: Please run the SQL policy setup in your Supabase SQL Editor to allow banner deletion.');
      }
      throw error;
    }

    // 3. Delete associated desktop and mobile images from Cloudflare R2 bucket
    if (bannerToDelete) {
      if (bannerToDelete.image_url) {
        await this.deleteCloudflareImage(bannerToDelete.image_url);
      }
      if (bannerToDelete.mobile_url) {
        await this.deleteCloudflareImage(bannerToDelete.mobile_url);
      }
    }

    return true;
  }
};
