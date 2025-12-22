import mongoose from "mongoose";

const rejectedOrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  items: [
    {
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    },
  ],

  totalCount: { type: Number, required: true },
  totalPrice: { type: Number, required: true },

  restaurantId: { type: String, required: true },

  orderDate: { type: Date, default: Date.now },

  rest: { type: String },

  status: { 
    type: String, 
    default: "rejected" 
  },

  orderId: { 
    type: String, 
    required: true,
    unique: true
  },

  rejectedAt: {
    type: Date,
    default: Date.now
  }
});

const RejectedOrder =
  mongoose.models.RejectedOrder ||
  mongoose.model("RejectedOrder", rejectedOrderSchema);

export default RejectedOrder;
