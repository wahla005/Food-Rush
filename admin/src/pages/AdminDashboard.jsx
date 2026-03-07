import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiX, FiLogOut, FiShield } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

const TABS = ['Stats', 'Orders', 'Food Items', 'Restaurants', 'Users'];

const AdminDashboard = () => {
    const { adminLogout } = useAdminAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('Stats');
    const [orders, setOrders] = useState([]);
    const [foods, setFoods] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [showAddFood, setShowAddFood] = useState(false);
    const [newFood, setNewFood] = useState({ name: '', description: '', image: '', price: '', category: '', isVeg: false, restaurant: '' });
    const [discountValues, setDiscountValues] = useState({});

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        try {
            if (tab === 'Orders') {
                const r = await API.get('/admin/orders'); setOrders(r.data);
            } else if (tab === 'Food Items') {
                const [f, rest] = await Promise.all([API.get('/foods'), API.get('/restaurants')]);
                setFoods(f.data); setRestaurants(rest.data);
            } else if (tab === 'Restaurants') {
                const r = await API.get('/restaurants'); setRestaurants(r.data);
            } else if (tab === 'Users') {
                const r = await API.get('/admin/users'); setUsers(r.data);
            } else if (tab === 'Stats') {
                const r = await API.get('/admin/stats'); setStats(r.data);
            }
        } catch (err) { console.error(err); }
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

    const updateOrderStatus = async (id, status) => {
        try {
            await API.put(`/admin/orders/${id}`, { status });
            setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
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

    const applyDiscount = async (id, value) => {
        const pct = Math.min(100, Math.max(0, Number(value)));
        try {
            const { data } = await API.put(`/admin/foods/${id}`, { discount: pct });
            setFoods(prev => prev.map(f => f._id === id ? { ...f, discount: data.discount } : f));
            toast.success(pct > 0 ? `${pct}% discount applied!` : 'Discount removed');
        } catch { toast.error('Failed to update discount'); }
    };

    const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    return (
        <div className="admin-dash-page">
            {/* ── Admin Navbar ── */}
            <header className="admin-header">
                <div className="admin-header-left">
                    <FiShield size={22} className="admin-header-icon" />
                    <span className="admin-header-title">Admin Dashboard</span>
                </div>
                <div className="admin-header-right">
                    <span className="admin-badge">🟢 Admin</span>
                    <button className="admin-logout-btn" onClick={handleLogout}>
                        <FiLogOut size={16} />
                        Logout
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
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o._id}>
                                        <td>{o._id.slice(-8).toUpperCase()}</td>
                                        <td>{o.user?.name}<br /><small>{o.user?.email}</small></td>
                                        <td>{o.restaurantName}</td>
                                        <td>Rs. {o.total}</td>
                                        <td>
                                            <select
                                                value={o.status}
                                                onChange={e => updateOrderStatus(o._id, e.target.value)}
                                                className="status-select"
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
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
                                        <input className="input-field" placeholder="Image URL (Unsplash)" value={newFood.image} onChange={e => setNewFood(f => ({ ...f, image: e.target.value }))} required />
                                        <div className="form-row">
                                            <input className="input-field" placeholder="Price (Rs.)" type="number" value={newFood.price} onChange={e => setNewFood(f => ({ ...f, price: e.target.value }))} required />
                                            <input className="input-field" placeholder="Category" value={newFood.category} onChange={e => setNewFood(f => ({ ...f, category: e.target.value }))} required />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <input type="checkbox" checked={newFood.isVeg} onChange={e => setNewFood(f => ({ ...f, isVeg: e.target.checked }))} />
                                            Vegetarian
                                        </label>
                                        <button type="submit" className="btn-orange">Add Item</button>
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
                                                <td><img src={f.image} alt={f.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
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
                                                            }}>🏷️ {disc}% OFF</span>
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
                                                    <button className="icon-btn danger" onClick={() => deleteFood(f._id)}><FiTrash2 /></button>
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
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Name</th>
                                    <th>Cuisine</th>
                                    <th>Rating</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {restaurants.map(r => (
                                    <tr key={r._id}>
                                        <td><img src={r.image} alt={r.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
                                        <td>{r.name}</td>
                                        <td>{r.cuisine.join(', ')}</td>
                                        <td>⭐ {r.rating}</td>
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
                                                {r.isOpen ? '🟢 Open' : '🔴 Closed'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── USERS ── */}
                {tab === 'Users' && (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Verified</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.isVerified ? '✅' : '❌'}</td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
