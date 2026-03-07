import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
    Pending: '#f59e0b',
    Confirmed: '#3b82f6',
    Preparing: '#8b5cf6',
    'Out for Delivery': '#f97316',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
};

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        API.get('/orders/my').then(r => { setOrders(r.data); setLoading(false); });
    }, []);

    const handleReorder = async (order) => {
        try {
            const foods = await Promise.all(order.items.map(i => API.get(`/foods/${i.food}`)));
            foods.forEach(r => addToCart(r.data, order.restaurant, order.restaurantName));
            toast.success('Items added to cart!');
        } catch {
            toast.error('Could not reorder');
        }
    };

    if (loading) return <div className="app-page"><Navbar /><div className="loading-center">Loading orders...</div></div>;

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <h1 className="page-title">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="empty-state">
                        <p>📦 No orders yet</p>
                        <Link to="/menu" className="btn-orange">Order Now</Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map(order => (
                            <div key={order._id} className="order-card">
                                <div className="order-card-header">
                                    <div>
                                        <h3>Order #{order._id.slice(-8).toUpperCase()}</h3>
                                        <p>{order.restaurantName}</p>
                                        <p className="order-date">{new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</p>
                                    </div>
                                    <span className="order-status-badge" style={{ backgroundColor: STATUS_COLORS[order.status] }}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-items-preview">
                                    {order.items.map((item, i) => (
                                        <span key={i} className="order-item-chip">{item.name} ×{item.quantity}</span>
                                    ))}
                                </div>

                                <div className="order-card-footer">
                                    <span className="order-total">Rs. {order.total}</span>
                                    <div className="order-actions">
                                        <button className="btn-outline-sm" onClick={() => handleReorder(order)}>♻️ Reorder</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderHistoryPage;
