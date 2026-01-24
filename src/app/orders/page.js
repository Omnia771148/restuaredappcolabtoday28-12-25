"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
// Import your custom loading component
import Loading from "../loading/page";
import { LocalNotifications } from '@capacitor/local-notifications';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const rest =
    typeof window !== "undefined"
      ? localStorage.getItem("restlocation")
      : null;

  const prevOrdersRef = useRef([]);

  // Enable audio notification
  const enableAudio = () => {
    setAudioEnabled(true);
    localStorage.setItem("audioEnabled", "true");
    const audio = new Audio("/noti.mp3");
    audio.play().catch(() => { });
  };

  useEffect(() => {
    // 🔹 CRITICAL: Request Notification Permissions for Android 13+
    const requestPermissions = async () => {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    };
    requestPermissions();

    if (localStorage.getItem("audioEnabled") === "true") {
      setAudioEnabled(true);
    }
  }, []);

  useEffect(() => {
    const restaurantId = localStorage.getItem("restid");

    if (!restaurantId) {
      alert("No Restaurant ID found");
      setLoading(false);
      return;
    }

    // 🔹 Fetch restaurant ACTIVE / INACTIVE status
    const fetchRestaurantStatus = async () => {
      try {
        const res = await axios.get(
          `/api/restaurant-status?restaurantId=${restaurantId}`
        );
        if (res.data.success) {
          setIsActive(res.data.isActive);
        }

        // 🔹 2. Send Restaurant ID to Native Background Runner
        const initBackgroundRunner = async (retryCount = 0) => {
          try {
            // Dynamic import to avoid SSR errors
            const { BackgroundRunner } = await import('@capacitor/background-runner');

            await BackgroundRunner.dispatchEvent({
              label: 'com.restapp.manager.checkOrders',
              event: 'setRestId',
              details: { restId: restaurantId }
            });
            console.log("Background Runner Configured with RestID:", restaurantId);
          } catch (bgErr) {
            console.warn(`Background Runner setup failed (Attempt ${retryCount + 1}):`, bgErr);
            if (retryCount < 3) {
              setTimeout(() => initBackgroundRunner(retryCount + 1), 2000); // Retry after 2s
            }
          }
        };
        initBackgroundRunner();

      } catch (err) {
        console.error("Status fetch error", err);
      }
    };

    // 🔹 Fetch orders
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `/api/orders?restaurantId=${restaurantId}`
        );

        if (res.data.success) {
          const newOrders = res.data.orders;

          const prevIds = prevOrdersRef.current.map((o) => o._id);
          const newIds = newOrders.map((o) => o._id);

          // ... inside fetchOrders ...

          const hasNewOrder = newIds.some((id) => !prevIds.includes(id));

          if (hasNewOrder && isActive) {
            // 1. Play Audio (Foreground)
            if (audioEnabled) {
              const audio = new Audio("/noti.mp3");
              audio.play().catch(() => { });
            }

            // 2. Trigger Native Notification (Background/Lock Screen)
            LocalNotifications.schedule({
              notifications: [
                {
                  title: "New Order Received! 🔔",
                  body: "Open the app to accept it.",
                  id: new Date().getTime(),
                  schedule: { at: new Date(Date.now() + 100) }, // Trigger immediately
                  sound: 'noti.mp3',
                  channelId: "default", // ⚠️ REQUIRED for Android 8+
                  actionTypeId: "",
                  extra: null
                }
              ]
            }).catch(e => console.error("Native notification failed", e));
          }

          setOrders(newOrders);
          prevOrdersRef.current = newOrders;
        }
      } catch (err) {
        console.error("Fetch orders error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantStatus();
    fetchOrders();

    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Update restaurant status
  const updateRestaurantStatus = async (status) => {
    setIsActive(status);

    await axios.patch("/api/restaurant-status", {
      restaurantId: localStorage.getItem("restid"),
      isActive: status,
    });
  };

  // 🔹 ACCEPT ORDER (Updated to send razorpayOrderId)
  async function acceptOrder(orderId, razorpayOrderId) {
    setLoading(true); // Start loading

    // 🟢 BACKUP TO LOCAL STORAGE IMMEDIATELY
    // This ensures that even if you delete from MongoDB immediately after, 
    // it is already saved in the restaurant's local browser.
    const orderToAccept = orders.find((o) => o._id === orderId);
    if (orderToAccept) {
      const restId = localStorage.getItem("restid");
      const lsKey = `acceptedOrders_${restId}`;
      const existing = JSON.parse(localStorage.getItem(lsKey)) || [];

      // Avoid duplicates based on the unique 'orderId'
      if (!existing.some((o) => o.orderId === orderToAccept.orderId)) {
        // Save it!
        const entry = { ...orderToAccept, razorpayOrderId };
        existing.push(entry);
        localStorage.setItem(lsKey, JSON.stringify(existing));
      }
    }

    try {
      const res = await axios.post("/api/orders/accept", {
        orderId,
        rest,
        razorpayOrderId, // 👈 Sending the ID here
      });

      if (res.data.success) {
        alert("✅ Order accepted");
        removeOrder(orderId);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Accept error:", err);
      alert("Error accepting order");
    } finally {
      setLoading(false); // Stop loading
    }
  }

  // 🔹 REJECT ORDER
  async function rejectOrder(orderId) {
    setLoading(true); // Start loading
    try {
      const res = await axios.post("/api/orders/reject", { orderId });

      if (res.data.success) {
        alert("❌ Order rejected");
        removeOrder(orderId);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Error rejecting order");
    } finally {
      setLoading(false); // Stop loading
    }
  }

  const removeOrder = (orderId) => {
    setOrders((prev) => prev.filter((o) => o._id !== orderId));
    prevOrdersRef.current = prevOrdersRef.current.filter(
      (o) => o._id !== orderId
    );
  };

  // Replace text loading with your custom component
  if (loading) return <Loading />;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🧾 Orders for Your Restaurant</h2>

      {/* 🔥 ACTIVE / INACTIVE BUTTONS */}
      <div style={{ marginBottom: "15px" }}>
        <h3>
          Restaurant Status:{" "}
          <span style={{ color: isActive ? "green" : "red" }}>
            {isActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </h3>

        <button
          onClick={() => updateRestaurantStatus(true)}
          style={{
            backgroundColor: "green",
            color: "white",
            padding: "8px 16px",
            marginRight: "10px",
            borderRadius: "6px",
            border: "none",
          }}
        >
          ACTIVE
        </button>

        <button
          onClick={() => updateRestaurantStatus(false)}
          style={{
            backgroundColor: "red",
            color: "white",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
          }}
        >
          INACTIVE
        </button>
      </div>

      <Link href="/AcceptedOrdersList">Accepted Orders</Link>

      <br />
      <br />

      {!audioEnabled && (
        <button
          onClick={enableAudio}
          style={{
            marginBottom: "12px",
            padding: "6px 12px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Enable Sound 🔔
        </button>
      )}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order._id}
              style={{
                marginBottom: "12px",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "8px",
                backgroundColor: "#f9f9f9",
              }}
            >
              {/* Items */}
              <ul>
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} — ₹{item.price} × {item.quantity}
                  </li>
                ))}
              </ul>

              {/* Schema details */}
              <p>
                <strong>User ID:</strong> {order.userId}
              </p>
              <p>
                <strong>Total Count:</strong> {order.totalCount}
              </p>
              <p>
                <strong>Total Price:</strong> ₹{order.totalPrice}
              </p>

              <p>
                <strong>Order Date:</strong>{" "}
                {new Date(order.orderDate).toLocaleString()}
              </p>
              <p>
                <strong>Order ID:</strong> {order.orderId}
              </p>


              {/* Action buttons */}
              <button
                // 👈 PASSING BOTH IDs HERE
                onClick={() => acceptOrder(order._id, order.razorpayOrderId)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                Accept
              </button>

              <button
                onClick={() => rejectOrder(order._id)}
                style={{
                  marginLeft: "8px",
                  padding: "6px 12px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}