import { serve } from "inngest/next";
import { inngest } from "@/config/inngest";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // Add your Inngest functions here
    inngest.syncUserCreation,
    inngest.syncUserUpdation,
    inngest.syncUserDeletion,
  ],
});
