import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiX, FiLogOut, FiShield, FiEdit, FiStar, FiChevronDown, FiRefreshCw, FiSettings, FiKey, FiCheckCircle } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

import { getImageUrl } from '../utils/image';

const TABS = ['Stats', 'Orders', 'Reviews', 'Food Items', 'Restaurants', 'Categories', 'Users', 'Settings'];

const AdminDashboard = () => {
    const { adminLogout } = useAdminAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('Stats');
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [foods, setFoods] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [showAddFood, setShowAddFood] = useState(false);
    const [showAddRestaurant, setShowAddRestaurant] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showEditFood, setShowEditFood] = useState(false);
    const [showEditCategory, setShowEditCategory] = useState(false);
    const [showEditRestaurant, setShowEditRestaurant] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newFood, setNewFood] = useState({ name: '', description: '', image: '', price: '', category: '', isVeg: false, restaurant: '' });
    const [newRestaurant, setNewRestaurant] = useState({ name: '', image: '', cuisine: '', deliveryTime: '30-45 min', minOrder: 200, deliveryFee: 50, description: '' });
    const [newCategory, setNewCategory] = useState({ name: '', image: '' });
    const [editingFood, setEditingFood] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingRestaurant, setEditingRestaurant] = useState(null);
    const [discountValues, setDiscountValues] = useState({});
    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [changingPwd, setChangingPwd] = useState(false);

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (tab === 'Orders') {
                const r = await API.get('/admin/orders'); setOrders(r.data);
            } else if (tab === 'Reviews') {
                const r = await API.get('/admin/reviews'); setReviews(r.data);
            } else if (tab === 'Food Items') {
                const [f, rest, cats] = await Promise.all([API.get('/admin/foods'), API.get('/restaurants'), API.get('/categories')]);
                setFoods(f.data); setRestaurants(rest.data); setCategories(cats.data);
            } else if (tab === 'Restaurants') {
                const r = await API.get('/restaurants'); setRestaurants(r.data);
            } else if (tab === 'Categories') {
                const r = await API.get('/categories'); setCategories(r.data);
            } else if (tab === 'Users') {
                const r = await API.get('/admin/users'); setUsers(r.data);
            } else if (tab === 'Stats') {
                const r = await API.get('/admin/stats'); setStats(r.data);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                adminLogout();
            } else {
                toast.error('Failed to load data. Please check server.');
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteReview = async (id) => {
        if (!window.confirm('Are you sure you want to delete this review? This will update the restaurant and product ratings.')) return;
        try {
            await API.delete(`/admin/reviews/${id}`);
            setReviews(prev => prev.filter(r => r._id !== id));
            toast.success('Review deleted');
        } catch {
            toast.error('Failed to delete review');
        }
    };

    const handleLogout = () => {
        adminLogout();
        toast.success('Logged out from admin panel');
        navigate('/login');
    };

    const toggleRestaurantStatus = async (id, currentStatus) => {
        try {
            const { data } = await API.put(`/admin/restaurants/${id}`, { isOpen: !currentStatus });
            setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isOpen: data.isOpen } : r));
            toast.success(`Restaurant marked as ${data.isOpen ? 'Open' : 'Closed'}`);
        } catch { toast.error('Failed to update status'); }
    };

    const togglePopularStatus = async (id, currentStatus) => {
        try {
            const { data } = await API.put(`/admin/restaurants/${id}`, { isPopular: !currentStatus });
            setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isPopular: data.isPopular } : r));
            toast.success(`Restaurant ${data.isPopular ? 'added to' : 'removed from'} popular list`);
        } catch { toast.error('Failed to update popular status'); }
    };

    const updateOrderStatus = async (id, status) => {
        let cancelReason = null;
        if (status === 'Cancelled') {
            const reason = window.prompt(
                'Enter the reason for cancelling this order (this will be shown to the customer):',
                'Order cancelled by admin.'
            );
            if (reason === null) return; // user pressed Cancel on prompt
            cancelReason = reason.trim() || 'Order cancelled by admin.';
        }

        try {
            await API.put(`/admin/orders/${id}`, { status, cancelReason });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status, cancelReason } : o));
            toast.success('Status updated');
        } catch { toast.error('Failed'); }
    };

    const deleteFood = async (id) => {
        if (!window.confirm('Delete this item?')) return;
        try {
            await API.delete(`/admin/foods/${id}`);
            setFoods(prev => prev.filter(f => f._id !== id));
            toast.success('Deleted');
        } catch { toast.error('Failed'); }
    };

    const handleImageUpload = async (e, setFormData) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploading(true);
            const { data } = await API.post('/admin/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Store the path from the server (handled by getImageUrl on display)
            setFormData(prev => ({ ...prev, image: data.url }));
            toast.success('Image uploaded successfully');
        } catch (err) {
            const msg = err.response?.data?.message || 'Image upload failed';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const addFood = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/admin/foods', { ...newFood, price: Number(newFood.price) });
            setFoods(prev => [data, ...prev]);
            setShowAddFood(false);
            setNewFood({ name: '', description: '', image: '', price: '', category: '', isVeg: false, restaurant: '' });
            toast.success('Food item added!');
        } catch { toast.error('Failed to add'); }
    };

    const addRestaurant = async (e) => {
        e.preventDefault();
        try {
            const cuisineArray = newRestaurant.cuisine.split(',').map(c => c.trim());
            const { data } = await API.post('/admin/restaurants', { ...newRestaurant, cuisine: cuisineArray });
            setRestaurants(prev => [data, ...prev]);
            setShowAddRestaurant(false);
            setNewRestaurant({ name: '', image: '', cuisine: '', deliveryTime: '30-45 min', minOrder: 200, deliveryFee: 50, description: '', address: '' });
            toast.success('Restaurant added!');
        } catch { toast.error('Failed to add'); }
    };

    const deleteRestaurant = async (id) => {
        if (!window.confirm('Delete this restaurant? This will also delete all its food items.')) return;
        try {
            await API.delete(`/admin/restaurants/${id}`);
            setRestaurants(prev => prev.filter(r => r._id !== id));
            toast.success('Restaurant deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const updateRestaurant = async (e) => {
        e.preventDefault();
        try {
            const cuisineValue = Array.isArray(editingRestaurant.cuisine)
                ? editingRestaurant.cuisine
                : editingRestaurant.cuisine.split(',').map(c => c.trim());

            const { data } = await API.put(`/admin/restaurants/${editingRestaurant._id}`, {
                ...editingRestaurant,
                cuisine: cuisineValue
            });
            setRestaurants(prev => prev.map(r => r._id === data._id ? data : r));
            setShowEditRestaurant(false);
            setEditingRestaurant(null);
            toast.success('Restaurant updated');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update';
            toast.error(msg);
        }
    };

    const addCategory = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post('/admin/categories', newCategory);
            setCategories(prev => [...prev, data]);
            setShowAddCategory(false);
            setNewCategory({ name: '', image: '' });
            toast.success('Category added');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to add category'); }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await API.delete(`/admin/categories/${id}`);
            setCategories(prev => prev.filter(c => c._id !== id));
            toast.success('Category deleted');
        } catch { toast.error('Failed to delete'); }
    };

    const updateFood = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put(`/admin/foods/${editingFood._id}`, { ...editingFood, price: Number(editingFood.price) });
            setFoods(prev => prev.map(f => f._id === data._id ? data : f));
            setShowEditFood(false);
            setEditingFood(null);
            toast.success('Food item updated');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update';
            toast.error(msg);
        }
    };

    const updateCategory = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put(`/admin/categories/${editingCategory._id}`, editingCategory);
            setCategories(prev => prev.map(c => c._id === data._id ? data : c));
            setShowEditCategory(false);
            setEditingCategory(null);
            toast.success('Category updated');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update';
            toast.error(msg);
        }
    };

    const toggleUserBlock = async (id, isBlocked) => {
        const action = isBlocked ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const { data } = await API.put(`/admin/users/${id}/block`);
            setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: data.isBlocked } : u));
            toast.success(`User ${data.isBlocked ? 'blocked' : 'unblocked'}`);
        } catch { toast.error('Failed to update user status'); }
    };

    const toggleTopRated = async (id, isTopRated) => {
        try {
            const { data } = await API.put(`/admin/foods/${id}`, { isTopRated: !isTopRated });
            setFoods(prev => prev.map(f => f._id === id ? { ...f, isTopRated: data.isTopRated } : f));
            toast.success(`Dish ${data.isTopRated ? 'added to' : 'removed from'} top rated`);
        } catch { toast.error('Failed to update status'); }
    };

    const applyDiscount = async (id, value) => {
        const pct = Math.min(100, Math.max(0, Number(value)));
        try {
            const { data } = await API.put(`/admin/foods/${id}`, { discount: pct });
            setFoods(prev => prev.map(f => f._id === id ? { ...f, discount: data.discount } : f));
            toast.success(pct > 0 ? `${pct}% discount applied!` : 'Discount removed');
        } catch { toast.error('Failed to update discount'); }
    };

    const STATUS_OPTIONS = ['Payment Pending', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Not Received'];

    const STATUS_COLORS = {
        'Payment Pending': '#f97316',
        Pending: '#f59e0b',
        Confirmed: '#3b82f6',
        Preparing: '#8b5cf6',
        'Out for Delivery': '#f97316',
        Delivered: '#10b981',
        Cancelled: '#ef4444',
        'Not Received': '#6366f1'
    };

    // Admin confirms digital wallet payment → move to Pending (standard flow)
    const confirmPayment = async (orderId) => {
        if (!window.confirm('Confirm this payment? The order will move to Pending status.')) return;
        try {
            await API.put(`/admin/orders/${orderId}`, { status: 'Pending', cancelReason: null });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'Pending', cancelReason: null } : o));
            toast.success('Payment confirmed! Order is now Pending.');
        } catch { toast.error('Failed to confirm payment'); }
    };

    // Admin declines payment proof → cancel order with reason
    const declinePayment = async (orderId) => {
        const reason = window.prompt(
            'Enter the reason for declining this payment (this will be shown to the customer):',
            'Payment proof is unclear or incorrect. Please contact support.'
        );
        if (reason === null) return; // user pressed Cancel on prompt
        const finalReason = reason.trim() || 'Payment proof declined by admin.';
        try {
            await API.put(`/admin/orders/${orderId}`, {
                status: 'Cancelled',
                cancelReason: finalReason,
            });
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, status: 'Cancelled', cancelReason: finalReason } : o
            ));
            toast.success('Order cancelled. Customer will be notified.');
        } catch { toast.error('Failed to decline payment'); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwdData.newPassword !== pwdData.confirmNewPassword) {
            return toast.error('New passwords do not match');
        }
        if (pwdData.newPassword.length < 6) {
            return toast.error('New password must be at least 6 characters');
        }

        try {
            setChangingPwd(true);
            await API.put('/admin/change-password', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            toast.success('Password changed successfully!');
            setPwdData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPwd(false);
        }
    };

    return (
        <div className="admin-dash-page">
            {/* ── Admin Navbar ── */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <FiShield size={22} className="admin-header-icon" />
                    <span className="admin-header-title">Admin Dashboard</span>
                </div>
                <div className="admin-header-right">
                    <span className="admin-badge">Admin</span>
                    <button
                        onClick={loadData}
                        className="admin-refresh-btn"
                        disabled={loading}
                        title="Refresh Data"
                    >
                        <FiRefreshCw className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={handleLogout} className="admin-logout-btn">
                        <FiLogOut /> Logout
                    </button>
                </div>
            </header>

            <main className="admin-dash-main">
                {/* Tabs */}
                <div className="admin-tabs">
                    {TABS.map(t => (
                        <button
                            key={t}
                            className={`admin-tab ${tab === t ? 'admin-tab-active' : ''}`}
                            onClick={() => setTab(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Loading Indicator */}
                {loading && !stats && tab === 'Stats' && (
                    <div className="admin-loading-wrap">
                        <div className="spinner"></div>
                        <p>Fetching latest stats...</p>
                    </div>
                )}

                {/* ── STATS ── */}
                {tab === 'Stats' && stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h2>{stats.totalOrders}</h2>
                            <p>Total Orders</p>
                        </div>
                        <div className="stat-card">
                            <h2>{stats.totalUsers}</h2>
                            <p>Total Users</p>
                        </div>
                        <div className="stat-card">
                            <h2>{stats.totalFoods}</h2>
                            <p>Menu Items</p>
                        </div>
                        <div className="stat-card">
                            <h2>Rs. {stats.totalRevenue?.toLocaleString()}</h2>
                            <p>Total Revenue</p>
                        </div>
                    </div>
                )}

                {tab === 'Stats' && stats && (
                    <div className="monthly-stats-container" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Monthly Revenue Section */}
                        <div className="admin-table-wrap" style={{ margin: 0 }}>
                            <h3 style={{ padding: '1rem', color: '#10b981' }}>Monthly Revenue Breakdown</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
                                        stats.monthlyRevenue.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </td>
                                                <td style={{ color: '#10b981', fontWeight: 700 }}>
                                                    Rs. {item.revenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="2" style={{ textAlign: 'center' }}>No revenue data yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Monthly Users Section */}
                        <div className="admin-table-wrap" style={{ margin: 0 }}>
                            <h3 style={{ padding: '1rem', color: '#3b82f6' }}>Monthly New User Signups</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>New Users</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.monthlyUsers && stats.monthlyUsers.length > 0 ? (
                                        stats.monthlyUsers.map((item, index) => (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </td>
                                                <td style={{ color: '#3b82f6', fontWeight: 700 }}>
                                                    {item.count}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="2" style={{ textAlign: 'center' }}>No user data yet</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'Stats' && !stats && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '3rem' }}>Loading stats…</p>
                )}

                {/* ── ORDERS ── */}
                {tab === 'Orders' && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Order #</th>
                                    <th>Customer</th>
                                    <th>Restaurant</th>
                                    <th>Total</th>
                                    <th>Payment</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <React.Fragment key={o._id}>
                                        <tr style={o.status === 'Payment Pending' ? { background: 'rgba(249,115,22,0.07)', borderLeft: '3px solid #f97316' } : {}}>
                                            <td>{o.dailyOrderNumber ? `#${o.dailyOrderNumber}` : o._id.slice(-8).toUpperCase()}</td>
                                            <td>{o.user?.name}<br /><small>{o.user?.email}</small></td>
                                            <td>{o.restaurantName}</td>
                                            <td>Rs. {o.total}</td>
                                            <td>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.25rem 0.65rem',
                                                    borderRadius: '50px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: o.paymentMethod === 'COD'
                                                        ? 'rgba(16,185,129,0.15)'
                                                        : o.paymentMethod === 'Card'
                                                            ? 'rgba(99,102,241,0.15)'
                                                            : 'rgba(249,115,22,0.15)',
                                                    color: o.paymentMethod === 'COD'
                                                        ? '#10b981'
                                                        : o.paymentMethod === 'Card'
                                                            ? '#818cf8'
                                                            : '#fb923c',
                                                    border: `1px solid ${o.paymentMethod === 'COD'
                                                        ? 'rgba(16,185,129,0.3)'
                                                        : o.paymentMethod === 'Card'
                                                            ? 'rgba(99,102,241,0.3)'
                                                            : 'rgba(249,115,22,0.3)'}`,
                                                }}>
                                                    {o.paymentMethod === 'COD' ? 'COD'
                                                        : o.paymentMethod === 'Card' ? 'Card'
                                                            : o.paymentMethod === 'EasyPaisa' ? 'EasyPaisa'
                                                                : o.paymentMethod === 'JazzCash' ? 'JazzCash'
                                                                    : o.paymentMethod || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="status-select-wrapper">
                                                    <select
                                                        value={o.status}
                                                        onChange={e => updateOrderStatus(o._id, e.target.value)}
                                                        className="status-select"
                                                        style={{
                                                            backgroundColor: (STATUS_COLORS[o.status] || '#6b7280') + '22',
                                                            color: STATUS_COLORS[o.status] || '#6b7280',
                                                            borderColor: (STATUS_COLORS[o.status] || '#6b7280') + '44',
                                                            fontWeight: '700'
                                                        }}
                                                    >
                                                        {STATUS_OPTIONS.map(s => (
                                                            <option key={s} value={s} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <FiChevronDown className="status-chevron" style={{ color: STATUS_COLORS[o.status] || '#6b7280' }} />
                                                </div>
                                            </td>
                                        </tr>
                                        {o.status === 'Payment Pending' && (
                                            <tr style={{ background: 'rgba(249,115,22,0.04)' }}>
                                                <td colSpan={6} style={{ padding: '0.75rem 1.2rem 1rem' }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                                                        <div style={{ flex: 1, minWidth: 180 }}>
                                                            <p style={{ fontWeight: 700, color: '#f97316', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                                                                Payment Verification Required
                                                            </p>
                                                            {o.mobilePayNumber && (
                                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: '0.1rem 0' }}>
                                                                    From: <strong style={{ color: '#fff' }}>{o.mobilePayNumber}</strong>
                                                                </p>
                                                            )}
                                                            {o.transactionRef && (
                                                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: '0.1rem 0' }}>
                                                                    TXN Ref: <strong style={{ color: '#fff', fontFamily: 'monospace', letterSpacing: '0.03em' }}>{o.transactionRef}</strong>
                                                                </p>
                                                            )}
                                                        </div>
                                                        {o.paymentProof && (
                                                            <a href={getImageUrl(o.paymentProof)} target="_blank" rel="noreferrer" title="Click to view full screenshot">
                                                                <img
                                                                    src={getImageUrl(o.paymentProof)}
                                                                    alt="Payment proof"
                                                                    style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 10, border: '2px solid #f97316', display: 'block' }}
                                                                />
                                                                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', display: 'block', marginTop: 3 }}>View screenshot</span>
                                                            </a>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                                            <button
                                                                onClick={() => confirmPayment(o._id)}
                                                                style={{
                                                                    padding: '0.55rem 1.2rem', borderRadius: 10, border: 'none',
                                                                    background: 'linear-gradient(135deg,#10b981,#059669)',
                                                                    color: 'white', fontWeight: 700, fontSize: '0.82rem',
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                                }}
                                                            >
                                                                ✓ Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => declinePayment(o._id)}
                                                                style={{
                                                                    padding: '0.55rem 1.2rem', borderRadius: 10, border: 'none',
                                                                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                                                                    color: 'white', fontWeight: 700, fontSize: '0.82rem',
                                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                                }}
                                                            >
                                                                ✕ Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── REVIEWS ── */}
                {tab === 'Reviews' && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Restaurant</th>
                                    <th>Product Rated</th>
                                    <th>Rating</th>
                                    <th>Feedback</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map(rev => (
                                    <tr key={rev._id}>
                                        <td>{new Date(rev.createdAt).toLocaleDateString()}</td>
                                        <td>{rev.user?.name}<br /><small>{rev.user?.email}</small></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                {rev.restaurant?.image && (
                                                    <img src={rev.restaurant.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                )}
                                                <div>
                                                    <p style={{ fontWeight: 800, color: '#f59e0b', margin: 0, fontSize: '1rem' }}>
                                                        {rev.restaurant?.name || rev.order?.restaurantName || 'Unknown Restaurant'}
                                                    </p>
                                                    <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>ID: {rev.restaurant?._id?.slice(-6).toUpperCase() || 'N/A'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                {rev.foodItem?.image && (
                                                    <img src={rev.foodItem.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                                )}
                                                <div style={{ lineHeight: 1.2 }}>
                                                    <p style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: '0.95rem' }}>{rev.foodItem?.name || 'Deleted Product'}</p>
                                                    <small style={{ color: 'rgba(245, 158, 11, 0.6)', fontWeight: 600, fontSize: '0.75rem' }}>Order {rev.order?.dailyOrderNumber ? `#${rev.order.dailyOrderNumber}` : `#${rev.order?._id?.slice(-8).toUpperCase()}`}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.1rem' }}>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <FiStar
                                                        key={n}
                                                        size={12}
                                                        fill={n <= rev.rating ? "#f59e0b" : "none"}
                                                        stroke={n <= rev.rating ? "#f59e0b" : "rgba(255,255,255,0.3)"}
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '300px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                                            {rev.comment}
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => deleteReview(rev._id)}
                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Review"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                                            No reviews found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── FOOD ITEMS ── */}
                {tab === 'Food Items' && (
                    <>
                        <button className="btn-orange" style={{ marginBottom: '1rem' }} onClick={() => setShowAddFood(true)}>
                            <FiPlus /> Add Food Item
                        </button>

                        {showAddFood && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Add New Food Item</h3>
                                        <button onClick={() => setShowAddFood(false)}><FiX /></button>
                                    </div>
                                    <form onSubmit={addFood} className="auth-form">
                                        <select className="input-field" value={newFood.restaurant} onChange={e => setNewFood(f => ({ ...f, restaurant: e.target.value }))} required>
                                            <option value="">Select Restaurant</option>
                                            {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                                        </select>
                                        <input className="input-field" placeholder="Name" value={newFood.name} onChange={e => setNewFood(f => ({ ...f, name: e.target.value }))} required />
                                        <input className="input-field" placeholder="Description" value={newFood.description} onChange={e => setNewFood(f => ({ ...f, description: e.target.value }))} />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Image (Upload from Gallery or Enter URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewFood)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL (Unsplash)" value={newFood.image} onChange={e => setNewFood(f => ({ ...f, image: e.target.value }))} required />
                                        </div>
                                        <div className="form-row">
                                            <input className="input-field" placeholder="Price (Rs.)" type="number" value={newFood.price} onChange={e => setNewFood(f => ({ ...f, price: e.target.value }))} required />
                                            <select className="input-field" value={newFood.category} onChange={e => setNewFood(f => ({ ...f, category: e.target.value }))} required>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={newFood.isVeg} onChange={e => setNewFood(f => ({ ...f, isVeg: e.target.checked }))} />
                                            Vegetarian
                                        </label>
                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Add Item'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {showEditFood && editingFood && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Edit Food Item</h3>
                                        <button onClick={() => { setShowEditFood(false); setEditingFood(null); }}><FiX /></button>
                                    </div>
                                    <form onSubmit={updateFood} className="auth-form">
                                        <input className="input-field" placeholder="Item Name" value={editingFood.name} onChange={e => setEditingFood(f => ({ ...f, name: e.target.value }))} required />
                                        <textarea className="input-field" placeholder="Description" value={editingFood.description} onChange={e => setEditingFood(f => ({ ...f, description: e.target.value }))} />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Food Image (Upload or URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditingFood)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL" value={editingFood.image} onChange={e => setEditingFood(f => ({ ...f, image: e.target.value }))} required />
                                        </div>

                                        <div className="form-row">
                                            <input className="input-field" placeholder="Price (Rs.)" type="number" value={editingFood.price} onChange={e => setEditingFood(f => ({ ...f, price: e.target.value }))} required />
                                            <select className="input-field" value={editingFood.category} onChange={e => setEditingFood(f => ({ ...f, category: e.target.value }))} required>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={editingFood.isVeg} onChange={e => setEditingFood(f => ({ ...f, isVeg: e.target.checked }))} />
                                            Vegetarian
                                        </label>
                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Update Food Item'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Price</th>
                                        <th>Discount</th>
                                        <th>Final Price</th>
                                        <th>Top Rated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {foods.map(f => {
                                        const disc = f.discount || 0;
                                        const finalPrice = disc > 0
                                            ? Math.round(f.price * (1 - disc / 100))
                                            : f.price;
                                        const inputVal = discountValues[f._id] !== undefined
                                            ? discountValues[f._id]
                                            : String(disc);
                                        return (
                                            <tr key={f._id}>
                                                <td><img src={getImageUrl(f.image)} alt={f.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
                                                <td>{f.name}</td>
                                                <td>{f.category}</td>
                                                <td>Rs. {f.price}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={inputVal}
                                                            onChange={e => setDiscountValues(v => ({ ...v, [f._id]: e.target.value }))}
                                                            style={{
                                                                width: 54, padding: '0.3rem 0.4rem',
                                                                background: 'rgba(255,255,255,0.08)',
                                                                border: '1px solid rgba(255,255,255,0.2)',
                                                                borderRadius: 8, color: '#fff',
                                                                fontFamily: "'Inter',sans-serif", fontSize: '0.82rem',
                                                                textAlign: 'center',
                                                            }}
                                                        />
                                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>%</span>
                                                        <button
                                                            onClick={() => applyDiscount(f._id, inputVal)}
                                                            title="Apply discount"
                                                            style={{
                                                                padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none',
                                                                background: 'rgba(124,58,237,0.25)', color: '#a78bfa',
                                                                fontWeight: 700, fontSize: '0.72rem',
                                                                fontFamily: "'Inter',sans-serif", cursor: 'pointer',
                                                            }}
                                                        >✓</button>
                                                        {disc > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    setDiscountValues(v => ({ ...v, [f._id]: '0' }));
                                                                    applyDiscount(f._id, 0);
                                                                }}
                                                                title="Remove discount"
                                                                style={{
                                                                    padding: '0.28rem 0.6rem', borderRadius: 6, border: 'none',
                                                                    background: 'rgba(239,68,68,0.2)', color: '#f87171',
                                                                    fontWeight: 700, fontSize: '0.72rem',
                                                                    fontFamily: "'Inter',sans-serif", cursor: 'pointer',
                                                                }}
                                                            >✕</button>
                                                        )}
                                                    </div>
                                                    {disc > 0 && (
                                                        <div style={{ marginTop: '0.2rem' }}>
                                                            <span style={{
                                                                background: 'rgba(251,191,36,0.2)',
                                                                color: '#fbbf24', fontSize: '0.7rem',
                                                                fontWeight: 700, padding: '0.1rem 0.45rem',
                                                                borderRadius: 50, border: '1px solid rgba(251,191,36,0.3)',
                                                            }}>{disc}% OFF</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    {disc > 0 ? (
                                                        <span>
                                                            <span style={{ color: '#f87171', textDecoration: 'line-through', marginRight: 4, fontSize: '0.8rem' }}>Rs. {f.price}</span>
                                                            <span style={{ color: '#34d399', fontWeight: 700 }}>Rs. {finalPrice}</span>
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <label className="switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={f.isTopRated}
                                                                onChange={() => toggleTopRated(f._id, f.isTopRated)}
                                                            />
                                                            <span className="slider round"></span>
                                                        </label>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: f.isTopRated ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                                                            {f.isTopRated ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="icon-btn edit" onClick={() => { setEditingFood(f); setShowEditFood(true); }}><FiEdit /></button>
                                                        <button className="icon-btn danger" onClick={() => deleteFood(f._id)}><FiTrash2 /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── RESTAURANTS ── */}
                {tab === 'Restaurants' && (
                    <>
                        <button className="btn-orange" style={{ marginBottom: '1rem' }} onClick={() => setShowAddRestaurant(true)}>
                            <FiPlus /> Add Restaurant
                        </button>

                        {showAddRestaurant && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Add New Restaurant</h3>
                                        <button onClick={() => setShowAddRestaurant(false)}><FiX /></button>
                                    </div>
                                    <form onSubmit={addRestaurant} className="auth-form">
                                        <input className="input-field" placeholder="Restaurant Name" value={newRestaurant.name} onChange={e => setNewRestaurant(r => ({ ...r, name: e.target.value }))} required />
                                        <input className="input-field" placeholder="Cuisine (comma separated, e.g. Pizza, Burgers)" value={newRestaurant.cuisine} onChange={e => setNewRestaurant(r => ({ ...r, cuisine: e.target.value }))} required />
                                        <input className="input-field" placeholder="Address / Location" value={newRestaurant.address} onChange={e => setNewRestaurant(r => ({ ...r, address: e.target.value }))} required />
                                        <input className="input-field" placeholder="Description" value={newRestaurant.description} onChange={e => setNewRestaurant(r => ({ ...r, description: e.target.value }))} />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Restaurant Banner (Upload or URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewRestaurant)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL" value={newRestaurant.image} onChange={e => setNewRestaurant(r => ({ ...r, image: e.target.value }))} required />
                                        </div>

                                        <div className="form-row">
                                            <input className="input-field" placeholder="Delivery Time (e.g. 20-30 min)" value={newRestaurant.deliveryTime} onChange={e => setNewRestaurant(r => ({ ...r, deliveryTime: e.target.value }))} />
                                            <input className="input-field" placeholder="Min Order (Rs.)" type="number" value={newRestaurant.minOrder} onChange={e => setNewRestaurant(r => ({ ...r, minOrder: e.target.value }))} />
                                        </div>
                                        <div className="form-row">
                                            <input className="input-field" placeholder="Delivery Fee (Rs.)" type="number" value={newRestaurant.deliveryFee} onChange={e => setNewRestaurant(r => ({ ...r, deliveryFee: e.target.value }))} />
                                        </div>
                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Add Restaurant'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {showEditRestaurant && editingRestaurant && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Edit Restaurant</h3>
                                        <button onClick={() => { setShowEditRestaurant(false); setEditingRestaurant(null); }}><FiX /></button>
                                    </div>
                                    <form onSubmit={updateRestaurant} className="auth-form">
                                        <input className="input-field" placeholder="Restaurant Name" value={editingRestaurant.name} onChange={e => setEditingRestaurant(r => ({ ...r, name: e.target.value }))} required />
                                        <input className="input-field" placeholder="Cuisine (comma separated)" value={Array.isArray(editingRestaurant.cuisine) ? editingRestaurant.cuisine.join(', ') : editingRestaurant.cuisine} onChange={e => setEditingRestaurant(r => ({ ...r, cuisine: e.target.value }))} required />
                                        <input className="input-field" placeholder="Address / Location" value={editingRestaurant.address || ''} onChange={e => setEditingRestaurant(r => ({ ...r, address: e.target.value }))} required />
                                        <input className="input-field" placeholder="Description" value={editingRestaurant.description} onChange={e => setEditingRestaurant(r => ({ ...r, description: e.target.value }))} />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Restaurant Banner (Upload or URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditingRestaurant)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL" value={editingRestaurant.image} onChange={e => setEditingRestaurant(r => ({ ...r, image: e.target.value }))} required />
                                        </div>

                                        <div className="form-row">
                                            <input className="input-field" placeholder="Delivery Time" value={editingRestaurant.deliveryTime} onChange={e => setEditingRestaurant(r => ({ ...r, deliveryTime: e.target.value }))} />
                                            <input className="input-field" placeholder="Min Order" type="number" value={editingRestaurant.minOrder} onChange={e => setEditingRestaurant(r => ({ ...r, minOrder: e.target.value }))} />
                                        </div>
                                        <div className="form-row">
                                            <input className="input-field" placeholder="Delivery Fee" type="number" value={editingRestaurant.deliveryFee} onChange={e => setEditingRestaurant(r => ({ ...r, deliveryFee: e.target.value }))} />
                                        </div>
                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Update Restaurant'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}


                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Cuisine</th>
                                        <th>Address</th>
                                        <th>Rating</th>
                                        <th>Status</th>
                                        <th>Popular</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restaurants.map(r => (
                                        <tr key={r._id}>
                                            <td><img src={getImageUrl(r.image)} alt={r.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
                                            <td>{r.name}</td>
                                            <td>{r.cuisine.join(', ')}</td>
                                            <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.address || '—'}</td>
                                            <td>{r.rating}</td>
                                            <td>
                                                <button
                                                    onClick={() => toggleRestaurantStatus(r._id, r.isOpen)}
                                                    style={{
                                                        padding: '0.35rem 0.9rem',
                                                        borderRadius: '50px',
                                                        border: 'none',
                                                        fontWeight: 700,
                                                        fontSize: '0.78rem',
                                                        cursor: 'pointer',
                                                        fontFamily: "'Inter', sans-serif",
                                                        transition: 'all 0.2s',
                                                        background: r.isOpen ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)',
                                                        color: r.isOpen ? '#10b981' : '#f87171',
                                                        border: r.isOpen ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                                                    }}
                                                >
                                                    {r.isOpen ? 'Open' : 'Closed'}
                                                </button>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={r.isPopular}
                                                            onChange={() => togglePopularStatus(r._id, r.isPopular)}
                                                        />
                                                        <span className="slider round"></span>
                                                    </label>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.isPopular ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                                                        {r.isPopular ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="icon-btn edit" onClick={() => { setEditingRestaurant(r); setShowEditRestaurant(true); }}><FiEdit /></button>
                                                    <button className="icon-btn danger" onClick={() => deleteRestaurant(r._id)}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── CATEGORIES ── */}
                {tab === 'Categories' && (
                    <>
                        <button className="btn-orange" style={{ marginBottom: '1rem' }} onClick={() => setShowAddCategory(true)}>
                            <FiPlus /> Add Category
                        </button>

                        {showAddCategory && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Add New Category</h3>
                                        <button onClick={() => setShowAddCategory(false)}><FiX /></button>
                                    </div>
                                    <form onSubmit={addCategory} className="auth-form">
                                        <input className="input-field" placeholder="Category Name (e.g. Burgers, Pizza)" value={newCategory.name} onChange={e => setNewCategory(c => ({ ...c, name: e.target.value }))} required />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Category Image (Upload or URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setNewCategory)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL" value={newCategory.image} onChange={e => setNewCategory(c => ({ ...c, image: e.target.value }))} required />
                                        </div>

                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Add Category'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {showEditCategory && editingCategory && (
                            <div className="modal-overlay">
                                <div className="modal-card">
                                    <div className="modal-header">
                                        <h3>Edit Category</h3>
                                        <button onClick={() => { setShowEditCategory(false); setEditingCategory(null); }}><FiX /></button>
                                    </div>
                                    <form onSubmit={updateCategory} className="auth-form">
                                        <input className="input-field" placeholder="Category Name (e.g. Burgers, Pizza)" value={editingCategory.name} onChange={e => setEditingCategory(c => ({ ...c, name: e.target.value }))} required />

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label className="input-label" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Category Image (Upload or URL)</label>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setEditingCategory)} style={{ marginBottom: '0.5rem', display: 'block', width: '100%', fontSize: '0.8rem' }} />
                                            <input className="input-field" placeholder="Or Image URL" value={editingCategory.image} onChange={e => setEditingCategory(c => ({ ...c, image: e.target.value }))} required />
                                        </div>

                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Update Category'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map(c => (
                                        <tr key={c._id}>
                                            <td><img src={getImageUrl(c.image)} alt={c.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
                                            <td>{c.name}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="icon-btn edit" onClick={() => { setEditingCategory(c); setShowEditCategory(true); }}><FiEdit /></button>
                                                    <button className="icon-btn danger" onClick={() => deleteCategory(c._id)}><FiTrash2 /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ── USERS ── */}
                {tab === 'Users' && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Method</th>
                                    <th>Not Received</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u, idx) => (
                                    <tr key={u._id}>
                                        <td style={{ fontWeight: 700, color: '#f59e0b', width: '3rem', textAlign: 'center' }}>{u.regNumber || (users.length - idx)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {u.name}
                                                {u.isBlocked && <span title="Blocked" style={{ color: '#f87171', fontSize: '0.8rem' }}> (Blocked)</span>}
                                            </div>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                                {u.googleId ? 'Google' : 'Email'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                color: u.notReceivedCount >= 3 ? '#f87171' : 'inherit',
                                                fontWeight: u.notReceivedCount >= 3 ? '800' : 'normal'
                                            }}>
                                                {u.notReceivedCount || 0}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '10px',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                background: u.isBlocked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                                color: u.isBlocked ? '#f87171' : '#10b981',
                                                border: u.isBlocked ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)'
                                            }}>
                                                {u.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => toggleUserBlock(u._id, u.isBlocked)}
                                                style={{
                                                    padding: '0.3rem 0.7rem',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    background: u.isBlocked ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                                    color: u.isBlocked ? '#10b981' : '#f87171',
                                                    transition: '0.2s'
                                                }}
                                            >
                                                {u.isBlocked ? 'Unblock' : 'Block User'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {/* ── SETTINGS ── */}
                {tab === 'Settings' && (
                    <div className="admin-settings-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                        <div className="admin-card" style={{ padding: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                <div style={{ background: 'rgba(249, 115, 22, 0.1)', padding: '0.8rem', borderRadius: '12px' }}>
                                    <FiKey size={24} color="#f97316" />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>Security Settings</h2>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Update your administrator password</p>
                                </div>
                            </div>

                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Current Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="••••••••"
                                        value={pwdData.currentPassword}
                                        onChange={e => setPwdData(p => ({ ...p, currentPassword: e.target.value }))}
                                        required
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>New Password</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            placeholder="••••••••"
                                            value={pwdData.newPassword}
                                            onChange={e => setPwdData(p => ({ ...p, newPassword: e.target.value }))}
                                            required
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            placeholder="••••••••"
                                            value={pwdData.confirmNewPassword}
                                            onChange={e => setPwdData(p => ({ ...p, confirmNewPassword: e.target.value }))}
                                            required
                                            style={{ marginBottom: 0 }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-orange"
                                    disabled={changingPwd}
                                    style={{
                                        marginTop: '1rem',
                                        height: '50px',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {changingPwd ? (
                                        <>
                                            <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle /> Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <FiShield size={20} color="#3b82f6" style={{ marginTop: '0.2rem' }} />
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>Security Note</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                                        Changing your password will update your credentials in the database.
                                        Make sure to use a strong password and keep it safe.
                                        You will stay logged in after changing your password.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
