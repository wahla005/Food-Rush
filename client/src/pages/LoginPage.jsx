import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

// Food images for the carousel (unsplash free-to-use)
const slides = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&q=80', // pizza
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80', // food bowl
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop&q=80', // burger
];

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [activeSlide, setActiveSlide] = useState(0);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleGoogleLogin = () => toast.error('Google login is currently unavailable');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            const { data } = await API.post('/auth/login', form);
            login(data.user, data.token);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate('/home');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* ── Left Panel ── */}
                <div className="auth-left">
                    <div className="auth-form-wrapper">
                        <h1 className="auth-title">Welcome Back!</h1>
                        <p className="auth-subtitle">Sign in with your Username and Password.</p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                className="input-field"
                            />

                            <PasswordInput
                                id="login-password"
                                name="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                            />

                            <div className="forgot-row">
                                <Link to="/forgot-password" className="forgot-link">Forget Password?</Link>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Signing in...' : 'Login'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="divider">
                            <span className="divider-line" />
                            <span className="divider-text">or login with</span>
                            <span className="divider-line" />
                        </div>

                        {/* Google button — LIVE */}
                        <button
                            type="button"
                            className="btn-social"
                            onClick={() => handleGoogleLogin()}
                            disabled={googleLoading}
                        >
                            <FcGoogle size={22} />
                            <span>{googleLoading ? 'Connecting...' : 'Login with Google'}</span>
                        </button>

                        <p className="register-row">
                            Did not have any account?{' '}
                            <Link to="/signup" className="register-link">Register Now</Link>
                        </p>
                    </div>
                </div>

                {/* ── Right Panel ── */}
                <div className="auth-right">
                    <img
                        src={slides[activeSlide]}
                        alt="Food"
                        className="slide-img"
                        key={activeSlide}
                    />
                    <div className="slide-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                className={`dot ${i === activeSlide ? 'dot-active' : ''}`}
                                onClick={() => setActiveSlide(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
