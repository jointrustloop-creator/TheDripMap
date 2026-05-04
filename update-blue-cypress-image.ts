import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const imageUrl = "https://bluecypressky.com/wp-content/uploads/2024/11/IV-Hydration-Therapy-Georgetown-KY.jpg";
  const slug = "blue-cypress-iv-and-wellness-georgetown";
  
  try {
    // 1. Fetch the image
    console.log(`Fetching image from ${imageUrl}...`);
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    const buffer = await response.arrayBuffer();
    
    // 2. Identify/Create Bucket
    const bucketName = 'providers';
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.find(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" not found. Creating it...`);
      const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      if (createBucketError) {
        console.warn('Could not create bucket:', createBucketError.message);
        // Fallback to the first available bucket if creation fails
        if (buckets && buckets.length > 0) {
          console.log(`Using fallback bucket: ${buckets[0].name}`);
          // bucketName = buckets[0].name; // Cannot reassign const, would need let
        } else {
          throw new Error('No storage buckets available and could not create one.');
        }
      }
    }

    // 3. Upload to Storage
    const fileName = `${slug}-${Date.now()}.jpg`;
    console.log(`Uploading to bucket "${bucketName}" as "${fileName}"...`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    
    // 4. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    console.log(`Public URL generated: ${publicUrl}`);
    
    // 5. Update Database
    console.log(`Updating database record for slug: ${slug}...`);
    // The user's request mentioned both image_url and "imageUrl". 
    // Usually one is camelCase for JSON/JS and one is snake_case for Postgres.
    const { data: updatedData, error: updateError } = await supabase
      .from('providers')
      .update({
        image_url: publicUrl,
        imageUrl: publicUrl
      })
      .eq('slug', slug)
      .select();
      
    if (updateError) {
      console.error('Database Update Error:', updateError);
    } else if (!updatedData || updatedData.length === 0) {
      console.warn(`No provider found with slug "${slug}".`);
    } else {
      console.log('Successfully updated provider image in database!');
      console.log('Update result:', updatedData[0]);
    }
    
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

run();
