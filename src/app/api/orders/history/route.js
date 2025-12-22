import { NextResponse } from "next/server";
import connectionToDatabase from "../../../../../lib/mongoose";
import AcceptedOrder from "../../../../../models/AcceptedOrder";
import RejectedOrder from "../../../../../models/RejectedOrder";

export async function GET(req) {
  try {
    await connectionToDatabase();

    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ success: false, message: "No restaurantId" });
    }

    const acceptedOrders = await AcceptedOrder.find({ restaurantId }).lean();
    const rejectedOrders = await RejectedOrder.find({ restaurantId }).lean();

    // Add status explicitly
    const accepted = acceptedOrders.map(order => ({
      ...order,
      orderStatus: "accepted"
    }));

    const rejected = rejectedOrders.map(order => ({
      ...order,
      orderStatus: "rejected"
    }));

    // Merge & sort by date
    const allOrders = [...accepted, ...rejected].sort(
      (a, b) => new Date(b.orderDate) - new Date(a.orderDate)
    );

    return NextResponse.json({
      success: true,
      orders: allOrders
    });
  } catch (err) {
    console.error("Order history error:", err);
    return NextResponse.json({ success: false });
  }
}
