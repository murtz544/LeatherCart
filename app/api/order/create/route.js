import { inngest } from "@/config/inngest";
import Product from "@/models/product";
import User from "@/models/user";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const { address, items } = await request.json();

        if (!address || items.length === 0) {
            return NextResponse.json({ success: false, message: "Address and items are required" });
        }

        const amount = await items.reduce(async (acc, item) => {
            const product = Product.findById(item.product);
            return await acc + product.offerPrice * item.quantity;
        }, 0);

       await inngest.send({
        name: 'order/created',
        data: {
            userId,
            address,
            items,
            amount: amount + Math.floor(amount * 0.02),
            date: Date.now()
        }
       })

       const user = await User.findById(userId);
       user.cartItems = {}
       await user.save();

       return NextResponse.json({ success: true, message: "Order created successfully" });
    } catch (error) {
        console.error("Error creating order route.js:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}