import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectionToDatabase from "../../../../../lib/mongoose";
import Order from "../../../../../models/Order";
import RejectedOrder from "../../../../../models/RejectedOrder";

// ✅ NEW: lightweight model for orderstatuses
const OrderStatus =
  mongoose.models.OrderStatus ||
  mongoose.model(
    "OrderStatus",
    new mongoose.Schema({}, { strict: false }), // allow any fields
    "orderstatuses" // force collection name
  );

export async function POST(req) {
  try {
    await connectionToDatabase();

    const { orderId } = await req.json();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({
        success: false,
        message: "Order not found",
      });
    }

    // Save exact same structure (UNCHANGED)
    await RejectedOrder.create({
      userId: order.userId,
      items: order.items,
      totalCount: order.totalCount,
      totalPrice: order.totalPrice,
      restaurantId: order.restaurantId,
      orderDate: order.orderDate,
      rest: order.rest,
      orderId: order.orderId,
      status: "rejected",
    });

    // Remove from active orders (UNCHANGED)
    await Order.findByIdAndDelete(orderId);

    // ✅ NEW: Update OrderStatus collection
    const result = await OrderStatus.updateOne(
      { orderId: order.orderId, status: "Pending" }, // match pending status
      { $set: { status: "Rejected by restaurant" } }
    );

    console.log("OrderStatus update result:", result);

    return NextResponse.json({
      success: true,
      message: "Order rejected and status updated",
    });
  } catch (err) {
    console.error("Reject order error:", err);
    return NextResponse.json({
      success: false,
      message: err.message || "Server error",
    });
  }
}