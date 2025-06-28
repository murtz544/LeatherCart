import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/user";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "leathercart" });

export const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
    },
    { event: 'clerk/user.created' },
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        const userData = {
            _id:id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            imageUrl: image_url,
        }
        await connectDB()
        await User.create(userData);
    }
)

export const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk"
    },
    { event: 'clerk/user.updated' },
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: first_name + " " + last_name,
            imageUrl: image_url,
        }
        await connectDB()
        await User.findByIdAndUpdate(id, userData);
    }
)

export const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-with-clerk"
    },
    { event: 'clerk/user.deleted' },
    async ({event}) => {
        const { id } = event.data;
        await connectDB()
        await User.findByIdAndDelete(id);
    }
)

export const createUserOrder = inngest.createFunction(
  {
    id: 'create-user-order',
    batchEvents: {
      maxSize: 5,
      timeout: '5s'
    }
  },
  { event: 'order/created' },
  async ({ events }) => {
    // 🧪 Debug: Log all incoming events
    console.log("📥 Received events:", events.length);
    events.forEach((event, index) => {
      console.log(`Event ${index}:`, {
        eventId: event.id,
        data: event.data,
        amount: event.data?.amount,
        amountType: typeof event.data?.amount
      });
    });

    const orders = events.map((event, index) => {
      const order = {
        userId: event.data.userId,
        items: event.data.items,
        amount: event.data.amount,
        address: event.data.address,
        date: event.data.date,
      };
      
      console.log(`Mapped order ${index}:`, order);
      return order;
    });

    // 🧪 Debug: Check for any undefined amount values
    const invalidOrders = orders.filter(order => typeof order.amount !== 'number');
    if (invalidOrders.length > 0) {
      console.error("❌ Invalid orders found:");
      invalidOrders.forEach((order, index) => {
        console.error(`Invalid order ${index}:`, {
          amount: order.amount,
          amountType: typeof order.amount,
          fullOrder: order
        });
      });
      throw new Error(`Validation failed: ${invalidOrders.length} events are missing a valid \`amount\` field.`);
    }

    await connectDB();
    await Order.insertMany(orders);

    return {
      success: true,
      processed: orders.length,
      message: "Orders processed successfully"
    };
  }
);