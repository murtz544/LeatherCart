import connectDB from "@/config/db";
import address from "@/models/address";
import order from "@/models/Order";
import product from "@/models/product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        await connectDB();

        address.length
        product.length

        const orders = await order.find({userId}).populate('address items.product')

        return NextResponse.json({ success: true, orders });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}