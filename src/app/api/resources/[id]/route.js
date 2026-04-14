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

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const formData = await req.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const publishedDate = formData.get('publishedDate');
    const pdfFile = formData.get('pdfFile');
    const coverPhoto = formData.get('coverPhoto');

    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (category) resource.category = category;
    if (publishedDate) resource.publishedDate = new Date(publishedDate);

    // Handle PDF update
    if (pdfFile) {
      // Upload new PDF to MEGA using the utility function
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
      const uploadResult = await uploadToMega(pdfBuffer, pdfFile.name);
      
      resource.pdfUrl = uploadResult.url;
      resource.pdfLink = uploadResult.url;
    }

    // Handle cover photo update
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

      // Delete old cover photo if exists
      if (resource.coverPhotoId) {
        await cloudinary.uploader.destroy(resource.coverPhotoId);
      }

      resource.coverPhotoId = uploadResult.public_id;
      resource.coverPhotoUrl = uploadResult.secure_url;
    }

    await resource.save();
    return NextResponse.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const resource = await Resource.findById(params.id);
    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Delete cover photo from Cloudinary
    if (resource.coverPhotoId) {
      await cloudinary.uploader.destroy(resource.coverPhotoId);
    }

    // Note: Currently we're not deleting the PDF from MEGA as we don't have the file handle
    // You might want to implement this if needed

    await Resource.findByIdAndDelete(params.id);
    return NextResponse.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}