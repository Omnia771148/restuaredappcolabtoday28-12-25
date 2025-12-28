import mongoose from "mongoose";

const acceptedOrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  items: [
    {
      itemId: String,
      name: String,
      price: Number,
      quantity: Number,
    },
  ],

  totalCount: Number,
  totalPrice: Number,

  // 👇 ADD THESE
  gst: Number,
  deliveryCharge: Number,
  grandTotal: Number,

  razorpayOrderId: String,
  razorpayPaymentId: String,
  paymentStatus: String,

  location: Object,

  restaurantId: String,
  aa: String,
  rest: String,

  orderDate: { type: Date, default: Date.now },

  status: { type: String, default: "active" },

  orderId: { type: String, required: true, unique: true },
});

const AcceptedOrder =
  mongoose.models.AcceptedOrder ||
  mongoose.model("AcceptedOrder", acceptedOrderSchema);

export default AcceptedOrder;
