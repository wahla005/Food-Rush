import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { FiTrash2, FiPlus, FiX, FiLogOut, FiShield, FiEdit } from 'react-icons/fi';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';

const TABS = ['Stats', 'Orders', 'Food Items', 'Restaurants', 'Categories', 'Users'];

const AdminDashboard = () => {
    const { adminLogout } = useAdminAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState('Stats');
    const [orders, setOrders] = useState([]);
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
    const [uploading, setUploading] = useState(false);
    const [newFood, setNewFood] = useState({ name: '', description: '', image: '', price: '', category: '', isVeg: false, restaurant: '' });
    const [newRestaurant, setNewRestaurant] = useState({ name: '', image: '', cuisine: '', deliveryTime: '30-45 min', minOrder: 200, deliveryFee: 50, description: '' });
    const [newCategory, setNewCategory] = useState({ name: '', image: '' });
    const [editingFood, setEditingFood] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [discountValues, setDiscountValues] = useState({});

    useEffect(() => { loadData(); }, [tab]);

    const loadData = async () => {
        try {
            if (tab === 'Orders') {
                const r = await API.get('/admin/orders'); setOrders(r.data);
            } else if (tab === 'Food Items') {
                const [f, rest, cats] = await Promise.all([API.get('/foods'), API.get('/restaurants'), API.get('/categories')]);
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
            // Construct full URL with backend base (removing '/api' suffix)
            const baseUrl = API.defaults.baseURL.replace('/api', '');
            const imageUrl = data.url.startsWith('http') ? data.url : `${baseUrl}${data.url}`;
            setFormData(prev => ({ ...prev, image: imageUrl }));
            toast.success('Image uploaded successfully');
        } catch (err) {
            toast.error('Image upload failed');
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
            setNewRestaurant({ name: '', image: '', cuisine: '', deliveryTime: '30-45 min', minOrder: 200, deliveryFee: 50, description: '' });
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
        } catch { toast.error('Failed to update'); }
    };

    const updateCategory = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.put(`/admin/categories/${editingCategory._id}`, editingCategory);
            setCategories(prev => prev.map(c => c._id === data._id ? data : c));
            setShowEditCategory(false);
            setEditingCategory(null);
            toast.success('Category updated');
        } catch { toast.error('Failed to update'); }
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

    const applyDiscount = async (id, value) => {
        const pct = Math.min(100, Math.max(0, Number(value)));
        try {
            const { data } = await API.put(`/admin/foods/${id}`, { discount: pct });
            setFoods(prev => prev.map(f => f._id === id ? { ...f, discount: data.discount } : f));
            toast.success(pct > 0 ? `${pct}% discount applied!` : 'Discount removed');
        } catch { toast.error('Failed to update discount'); }
    };

    const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled', 'Not Received'];

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
                                            🌿 Vegetarian
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
                                        <button type="submit" className="btn-orange" disabled={uploading}>
                                            {uploading ? 'Uploading Image...' : 'Add Restaurant'}
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
                                        <th>Rating</th>
                                        <th>Status</th>
                                        <th>Actions</th>
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
                                            <td>
                                                <button className="icon-btn danger" onClick={() => deleteRestaurant(r._id)}><FiTrash2 /></button>
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
                                            <td><img src={c.image} alt={c.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} /></td>
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
                                {users.map(u => (
                                    <tr key={u._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {u.name}
                                                {u.isBlocked && <span title="Blocked" style={{ color: '#f87171', fontSize: '0.8rem' }}>🚫</span>}
                                            </div>
                                        </td>
                                        <td>{u.email}</td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                                {u.googleId ? '🌐 Google' : '📧 Email'}
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
            </main>
        </div>
    );
};

export default AdminDashboard;
