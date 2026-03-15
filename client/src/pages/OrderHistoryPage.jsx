import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { FiStar, FiX } from 'react-icons/fi';

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
    const [ratingActiveKey, setRatingActiveKey] = useState(null); // 'orderId-foodId'
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
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

    const submitReview = async (orderId, restaurantId, foodId) => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }
        setSubmitting(true);
        try {
            await API.post('/reviews', {
                restaurant: restaurantId,
                order: orderId,
                foodItem: foodId,
                rating,
                comment
            });
            toast.success('Thank you for your feedback!');
            setRatingActiveKey(null);
            setRating(0);
            setComment('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
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
                                        <h3>Order {order.dailyOrderNumber ? `#${order.dailyOrderNumber}` : `#${order._id.slice(-8).toUpperCase()}`}</h3>
                                        <p>{order.restaurantName}</p>
                                        <p className="order-date">{new Date(order.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}</p>
                                        {order.status === 'Cancelled' && order.cancelReason && (
                                            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 500 }}>
                                                Reason: {order.cancelReason}
                                            </p>
                                        )}
                                    </div>
                                    <span className="order-status-badge" style={{ backgroundColor: STATUS_COLORS[order.status] }}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="order-items-preview" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {order.items.map((item, i) => {
                                        const isRatingThis = ratingActiveKey === `${order._id}-${item.food}`;
                                        return (
                                            <div key={i} style={{ display: 'flex', flexDirection: 'column', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                        {item.image && <img src={item.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />}
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--dark)' }}>{item.name}</p>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>Quantity: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                    {order.status === 'Delivered' && !isRatingThis && (
                                                        <button
                                                            className="btn-rate-item"
                                                            style={{
                                                                background: 'rgba(245, 158, 11, 0.1)',
                                                                color: '#f59e0b',
                                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                                padding: '0.4rem 0.8rem',
                                                                borderRadius: '8px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem'
                                                            }}
                                                            onClick={() => {
                                                                setRatingActiveKey(`${order._id}-${item.food}`);
                                                                setRating(0);
                                                                setComment('');
                                                            }}
                                                        >
                                                            <FiStar size={14} /> Rate
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Inline Rating Form */}
                                                {isRatingThis && (
                                                    <div style={{ padding: '0.5rem 1rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.3s ease' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                                            {[1, 2, 3, 4, 5].map(num => (
                                                                <FiStar
                                                                    key={num}
                                                                    size={24}
                                                                    fill={num <= rating ? "#f59e0b" : "none"}
                                                                    stroke={num <= rating ? "#f59e0b" : "var(--gray)"}
                                                                    style={{
                                                                        cursor: 'pointer',
                                                                        transition: 'transform 0.2s',
                                                                        transform: num <= rating ? 'scale(1.1)' : 'scale(1)'
                                                                    }}
                                                                    onClick={() => setRating(num)}
                                                                />
                                                            ))}
                                                        </div>
                                                        <textarea
                                                            className="input-field"
                                                            style={{ minHeight: '60px', fontSize: '0.85rem', marginBottom: '0.8rem', background: 'var(--light-gray)', color: 'var(--dark)' }}
                                                            placeholder={`How was the ${item.name}?`}
                                                            value={comment}
                                                            onChange={e => setComment(e.target.value)}
                                                        />
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn-orange"
                                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                                                                onClick={() => submitReview(order._id, order.restaurant, item.food)}
                                                                disabled={submitting}
                                                            >
                                                                {submitting ? 'Submitting...' : 'Submit'}
                                                            </button>
                                                            <button
                                                                className="btn-outline-sm"
                                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                                onClick={() => setRatingActiveKey(null)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="order-card-footer" style={{ marginTop: '1rem' }}>
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
