import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useAdminAuth } from '../context/AdminAuthContext';
import { FiLock, FiMail, FiShield } from 'react-icons/fi';
import PasswordInput from '../components/PasswordInput';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { adminLogin } = useAdminAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post('/admin/login', form);
            adminLogin(data.token);
            toast.success('Welcome, Admin! 🛡️');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid admin credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            {/* Animated background blobs */}
            <div className="admin-login-bg">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            <div className="admin-login-card">
                {/* Shield icon header */}
                <div className="admin-login-icon-wrap">
                    <div className="admin-login-icon">
                        <FiShield size={36} />
                    </div>
                </div>

                <h1 className="admin-login-title">Admin Portal</h1>
                <p className="admin-login-subtitle">
                    Restricted access — authorized personnel only
                </p>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {/* Email Field */}
                    <div className="admin-input-group">
                        <label className="admin-input-label">
                            <FiMail size={14} />
                            <span>Admin Email</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter admin email"
                            value={form.email}
                            onChange={handleChange}
                            className="admin-input-field"
                            autoComplete="off"
                        />
                    </div>

                    {/* Password Field */}
                    <div className="admin-input-group">
                        <label className="admin-input-label">
                            <FiLock size={14} />
                            <span>Password</span>
                        </label>
                        <PasswordInput
                            id="admin-password"
                            name="password"
                            placeholder="Enter admin password"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    <button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="admin-btn-loading">
                                <span className="spinner-sm" />
                                Authenticating...
                            </span>
                        ) : (
                            '🔐 Sign in as Admin'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginPage;
