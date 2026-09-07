// app/api/portfolio/upload/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req) {
  try {
    console.log('=== UPLOAD ROUTE STARTED ===');
    
    // Get user
    const currentUser = getUserFromRequest(req);
    console.log('User found:', !!currentUser);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Configure Cloudinary
    console.log('Configuring Cloudinary...');
    console.log('Cloud Name from env:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Parse form data
    console.log('Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file');
    
    console.log('File received:', !!file);
    console.log('File name:', file?.name);
    console.log('File size:', file?.size);
    console.log('File type:', file?.type);

    if (!file) {
      console.log('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large:', file.size);
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      console.log('Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image or video.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    console.log('Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Buffer size:', buffer.length);

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary...');
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
          resource_type: 'auto',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary error details:', error);
            reject(error);
          } else {
            console.log('Cloudinary success:', result.secure_url);
            resolve(result);
          }
        }
      );

      const { Readable } = require('stream');
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    console.log('Upload complete!');
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    });

  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { error: 'Upload failed: ' + error.message },
      { status: 500 }
    );
  }
}