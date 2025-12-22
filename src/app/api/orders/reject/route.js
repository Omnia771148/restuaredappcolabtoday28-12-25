import { NextResponse } from "next/server";
import connectionToDatabase from "../../../../../lib/mongoose";
import Order from "../../../../../models/Order";
import RejectedOrder from "../../../../../models/RejectedOrder";

export async function POST(req) {
  try {
    await connectionToDatabase();

    const { orderId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({
        success: false,
        message: "Order not found"
      });
    }

    // Save exact same structure
    await RejectedOrder.create({
      userId: order.userId,
      items: order.items,
      totalCount: order.totalCount,
      totalPrice: order.totalPrice,
      restaurantId: order.restaurantId,
      orderDate: order.orderDate,
      rest: order.rest,
      orderId: order.orderId,
      status: "rejected"
    });

    // Remove from active orders
    await Order.findByIdAndDelete(orderId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reject order error:", err);
    return NextResponse.json({
      success: false,
      message: "Server error"
    });
  }
}
