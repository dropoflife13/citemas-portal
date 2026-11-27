import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getUserFromRequest, isTokenVersionValid } from '@/lib/auth';
import { getFreshUser } from '@/lib/permissions';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { Readable } from 'stream';

const CAN_UPLOAD = ['super_admin', 'teacher', 'adviser', 'officer', 'member', 'alumni', 'applicant', 'user'];

function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  // GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return 'image/gif';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export async function POST(req) {
  try {
    // Verify user credentials against fresh DB record
    const currentUser = getUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const fresh = await getFreshUser(currentUser.id);
    if (!fresh || !isTokenVersionValid(currentUser, fresh)) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!CAN_UPLOAD.includes(fresh.role)) {
      return NextResponse.json({ error: 'You do not have permission to upload portfolio media' }, { status: 403 });
    }

    // Rate limit uploads per user and IP
    const ip = getClientIp(req);
    const userLimit = rateLimit(`upload:user:${currentUser.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!userLimit.ok) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(userLimit.retryAfterSec) } }
      );
    }
    const ipLimit = rateLimit(`upload:ip:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSec) } }
      );
    }

    // Precheck Cloudinary env vars
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary environment variables are not configured.');
      return NextResponse.json({ error: 'Media upload service is not configured.' }, { status: 503 });
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Max 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Server-side magic-byte validation (do not trust client-supplied file.type alone)
    const detectedType = detectImageType(buffer);
    if (!detectedType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
        { status: 400 }
      );
    }

    // Stream upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    }, { status: 200 });

  } catch (error) {
    console.error('=== UPLOAD ERROR ===', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}