import connectDB from "@/config/db";
import authSeller from "@/lib/authSeller";
import address from "@/models/address";
import order from "@/models/Order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isSeller = await authSeller(userId);

        if (!isSeller) {
            return NextResponse.json({ success: false, message: "You are not authorized to view this data" });
        }

        await connectDB();

        address.length
        const orders = await order.find({ }).populate('address items.product');
        return NextResponse.json({ success: true, orders });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message });
    }
}