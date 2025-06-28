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

        // ✅ Method 1: Using Promise.all (recommended for performance)
        const productPromises = items.map(async (item) => {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }
            return product.offerPrice * item.quantity;
        });

        const itemAmounts = await Promise.all(productPromises);
        const subtotal = itemAmounts.reduce((sum, itemAmount) => sum + itemAmount, 0);
        const amount = subtotal + Math.floor(subtotal * 0.02); // Adding 2% fee

        // ✅ Alternative Method 2: Sequential processing (slower but simpler)
        // let subtotal = 0;
        // for (const item of items) {
        //     const product = await Product.findById(item.product);
        //     if (!product) {
        //         throw new Error(`Product not found: ${item.product}`);
        //     }
        //     subtotal += product.offerPrice * item.quantity;
        // }
        // const amount = subtotal + Math.floor(subtotal * 0.02);

        // 🧪 Debug: Log the calculated amount
        console.log("💰 Order calculation:", {
            subtotal,
            fee: Math.floor(subtotal * 0.02),
            totalAmount: amount,
            items: items.length
        });

        // Validate amount before sending event
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error(`Invalid amount calculated: ${amount}`);
        }

        await inngest.send({
            name: 'order/created',
            data: {
                userId,
                address,
                items,
                amount,
                date: Date.now()
            }
        });

        const user = await User.findById(userId);
        user.cartItems = {};
        await user.save();

        return NextResponse.json({ 
            success: true, 
            message: "Order created successfully",
            amount // Optional: return the amount for confirmation
        });
    } catch (error) {
        console.error("Error creating order route.js:", error);
        return NextResponse.json({ success: false, message: error.message });
    }
}