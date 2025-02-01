// Currently, this only works for uploading to the muni_docs bucket. We can easily generalize this to any bucket in the future.

import { Upload } from 'lucide-react'
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadDocument = async (file: File): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, upload the file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Upload to muni_docs bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('muni_docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('muni_docs')
      .getPublicUrl(filePath);

    // Create the document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: user.id,
          title: file.name,
          file_url: publicUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (documentError) {
      console.error('Document creation error:', documentError);
      throw documentError;
    }

    // Verify the document was created and has an ID
    if (!documentData?.id) {
      throw new Error('Document created but no ID returned');
    }

    console.log('Document uploaded successfully:', {
      documentId: documentData.id,
      filePath,
      publicUrl
    });

    return documentData.id;

  } catch (error) {
    console.error('Error in uploadDocument:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload document. Please try again.';
    throw new Error(errorMessage);
  }
};
