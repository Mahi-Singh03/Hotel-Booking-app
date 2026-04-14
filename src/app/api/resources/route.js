import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { uploadToMega } from '@/src/lib/megaStorage';
import connectDB from '@/src/lib/DBconnection';
import Resource from '@/src/models/books';

export const runtime = 'nodejs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const title = formData.get('title');
    const description = formData.get('description') || '';
    const category = formData.get('category') || 'Other';
    const publishedDate = formData.get('publishedDate');
    const pdfFile = formData.get('pdfFile');
    const coverPhoto = formData.get('coverPhoto');

    if (!title || !pdfFile) {
      return NextResponse.json({ error: 'Title and PDF file are required' }, { status: 400 });
    }

    // Upload PDF to MEGA using the utility function
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
    const uploadResult = await uploadToMega(pdfBuffer, pdfFile.name);
    
    const pdfUrl = uploadResult.url;
    const pdfLink = pdfUrl;

    // Handle cover photo upload to Cloudinary
    let coverPhotoData = {};
    if (coverPhoto) {
      const bytes = await coverPhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'resource_covers' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      coverPhotoData = {
        coverPhotoId: uploadResult.public_id,
        coverPhotoUrl: uploadResult.secure_url,
      };
    }

    const resource = new Resource({
      title,
      description,
      category,
      publishedDate: publishedDate ? new Date(publishedDate) : null,
      pdfUrl,
      pdfLink,
      ...coverPhotoData,
    });

    await resource.save();
    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    // Check for authentication token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 9;
    const skip = (page - 1) * limit;

    let query = {};
    if (name) {
      query = { $text: { $search: name } };
    } else if (category) {
      query = { category };
    }

    const totalResources = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ publishedDate: -1 });

    const totalPages = Math.ceil(totalResources / limit);

    return NextResponse.json({
      resources,
      totalResources,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}