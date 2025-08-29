import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// src/lib/utils.ts

// ... (existing code in the file)

import { supabase } from '@/integrations/supabase/client';

export const uploadWhiskyImage = async (file: File, whiskyId?: string) => {
  try {
    // 1. Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      console.error("Session error:", sessionError);
      throw new Error("You must be logged in to upload images");
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `whiskies/${fileName}`;
    console.log('Starting upload for file:', file.name);

    // 2. Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whisky-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    console.log('File uploaded to storage successfully');

    // 3. Insert media record using the secure admin function
    const { data: mediaData, error: mediaError } = await supabase
      .rpc('admin_insert_media', {
        p_filename: fileName,
        p_original_name: file.name,
        p_file_path: filePath,
        p_bucket_name: 'whisky-images',
        p_file_size: file.size,
        p_mime_type: file.type,
        p_category: 'whisky',
        p_user_id: session.user.id // Pass the user's ID
      });

    if (mediaError) {
      console.error('Media library error:', mediaError);
      // Clean up uploaded file if media record creation failed
      await supabase.storage
        .from('whisky-images')
        .remove([filePath]);
      throw new Error(`Failed to create media record: ${mediaError.message}`);
    }

    console.log('Media record created successfully:', mediaData);

    // 4. Get public URL
    const { data: urlData } = supabase.storage
      .from('whisky-images')
      .getPublicUrl(filePath);

    return {
      id: mediaData,
      url: urlData.publicUrl,
      path: filePath,
      filename: fileName
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
