import connectDB from '@/config/db';
import authSeller from '@/lib/authSeller';
import product from '@/models/product';
import { getAuth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "You are not authorized to add products" });
        }

        const formData = await request.formData();
        const name = formData.get('name');
        const description = formData.get('description');
        const price = formData.get('price');
        const category = formData.get('category');
        const files = formData.getAll('images');
        const offerPrice = formData.get('offerPrice');

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: "No files uploaded" });
        }

        const result = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({
                        resource_type: 'auto'
                    },(error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    })
                    stream.end(buffer);
                })
            })
        );

        const image = result.map((res) => res.secure_url);
        await connectDB();

        const productData = await product.create({
            userId,
            name,
            description,
            price: Number(price),
            offerPrice: Number(offerPrice),
            image,
            category,
            date: Date.now(),
        })

        return NextResponse.json({ success: true, message: "Upload successful", productData });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}