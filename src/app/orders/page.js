'use client';

import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Link from 'next/link';

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const rest =
    typeof window !== 'undefined'
      ? localStorage.getItem('restlocation')
      : null;

  const prevOrdersRef = useRef([]);

  // Enable audio notification
  const enableAudio = () => {
    setAudioEnabled(true);
    const audio = new Audio('/noti.mp3');
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const restaurantId = localStorage.getItem('restid');

    if (!restaurantId) {
      alert('No Restaurant ID found');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `/api/orders?restaurantId=${restaurantId}`
        );

        if (res.data.success) {
          const newOrders = res.data.orders;

          const prevIds = prevOrdersRef.current.map(o => o._id);
          const newIds = newOrders.map(o => o._id);

          const hasNewOrder = newIds.some(id => !prevIds.includes(id));

          if (hasNewOrder && audioEnabled) {
            const audio = new Audio('/noti.mp3');
            audio.play().catch(() => {});
          }

          setOrders(newOrders);
          prevOrdersRef.current = newOrders;
        }
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [audioEnabled]);

  // ACCEPT ORDER
  async function acceptOrder(orderId) {
    try {
      const res = await axios.post('/api/orders/accept', {
        orderId,
        rest
      });

      if (res.data.success) {
        alert('✅ Order accepted');
        removeOrder(orderId);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error('Accept error:', err);
      alert('Error accepting order');
    }
  }

  // REJECT ORDER
  async function rejectOrder(orderId) {
    try {
      const res = await axios.post('/api/orders/reject', { orderId });

      if (res.data.success) {
        alert('❌ Order rejected');
        removeOrder(orderId);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Error rejecting order');
    }
  }

  // Remove order from UI + ref
  const removeOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
    prevOrdersRef.current = prevOrdersRef.current.filter(
      o => o._id !== orderId
    );
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>🧾 Orders for Your Restaurant</h2>

      <Link href="/AcceptedOrdersList">Accepted Orders</Link>

      <br /><br />

      {!audioEnabled && (
        <button
          onClick={enableAudio}
          style={{
            marginBottom: '12px',
            padding: '6px 12px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Enable Notifications 🔔
        </button>
      )}

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.map(order => (
            <li
              key={order._id}
              style={{
                marginBottom: '12px',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <p><strong>Items:</strong></p>

              <ul>
                {order.items.map((item, idx) => (
                  <li key={idx}>
                    {item.name} — ₹{item.price} × {item.quantity}
                  </li>
                ))}
              </ul>

              <p><strong>Total:</strong> ₹{order.totalPrice}</p>
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>User ID:</strong> {order.userId}</p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(order.orderDate).toLocaleString()}
              </p>

              <button
                onClick={() => acceptOrder(order._id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Accept
              </button>

              <button
                onClick={() => rejectOrder(order._id)}
                style={{
                  marginLeft: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
            </li>
          ))}
        </ul>
        
        
      )}
      <div>
        <div className="row">
                    <button onClick={() => window.location.href = "/AcceptedOrdersList"} style={{ backgroundColor: "green" }}>Accepted orders</button>
                </div>
                <div className="row">
                    <button onClick={() => window.location.href = "/todayorders"} style={{ backgroundColor: "green" }}>rejected orders</button>
                </div>
      </div>
  
    </div>
  );
}
