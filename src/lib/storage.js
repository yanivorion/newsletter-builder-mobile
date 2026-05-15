import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'newsletter-images';

/**
 * Upload an image to Supabase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} folder - Optional folder path (e.g., 'logos', 'headers')
 * @param {string} userId - The user ID (for organizing files)
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadImage(file, folder = 'uploads', userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  // Generate unique filename
  const fileExt = file.name?.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = userId ? `${userId}/${folder}/${fileName}` : `${folder}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath
  };
}

/**
 * Upload a base64 image to Supabase Storage
 * @param {string} base64Data - Base64 encoded image data (with or without prefix)
 * @param {string} folder - Optional folder path
 * @param {string} userId - The user ID
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadBase64Image(base64Data, folder = 'uploads', userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  // Extract base64 content and mime type
  let base64Content = base64Data;
  let mimeType = 'image/png';
  
  if (base64Data.includes(',')) {
    const [header, content] = base64Data.split(',');
    base64Content = content;
    const mimeMatch = header.match(/data:([^;]+);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }
  }

  // Convert base64 to Blob
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  // Get file extension from mime type
  const ext = mimeType.split('/')[1] || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const filePath = userId ? `${userId}/${folder}/${fileName}` : `${folder}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, blob, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath
  };
}

/**
 * Delete an image from Supabase Storage
 * @param {string} filePath - The file path in storage
 */
export async function deleteImage(filePath) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw error;
  }

  return true;
}

/**
 * List images in a folder
 * @param {string} folder - The folder path
 * @param {string} userId - The user ID
 */
export async function listImages(folder = 'uploads', userId) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const path = userId ? `${userId}/${folder}` : folder;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (error) {
    console.error('List error:', error);
    throw error;
  }

  // Add public URLs to each file
  const filesWithUrls = data.map(file => {
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`${path}/${file.name}`);

    return {
      ...file,
      url: urlData.publicUrl,
      path: `${path}/${file.name}`
    };
  });

  return filesWithUrls;
}

/**
 * Save media record to database
 */
export async function saveMediaRecord(userId, mediaData) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('media')
    .insert([{
      user_id: userId,
      name: mediaData.name,
      file_path: mediaData.path,
      file_url: mediaData.url,
      file_type: mediaData.type || 'image/png',
      file_size: mediaData.size,
      width: mediaData.width,
      height: mediaData.height,
      folder: mediaData.folder || 'uploads',
      tags: mediaData.tags || []
    }])
    .select()
    .single();

  if (error) {
    console.error('Save media record error:', error);
    throw error;
  }

  return data;
}

/**
 * Get user's media library
 */
export async function getMediaLibrary(userId, folder = null) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  let query = supabase
    .from('media')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (folder) {
    query = query.eq('folder', folder);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Get media library error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Delete media record and file
 */
export async function deleteMedia(userId, mediaId, filePath) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  // Delete from storage
  await deleteImage(filePath);

  // Delete from database
  const { error } = await supabase
    .from('media')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete media record error:', error);
    throw error;
  }

  return true;
}

export default {
  uploadImage,
  uploadBase64Image,
  deleteImage,
  listImages,
  saveMediaRecord,
  getMediaLibrary,
  deleteMedia
};


