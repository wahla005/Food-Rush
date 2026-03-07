import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import API from '../api/axios';

const slides = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
];

const SignupPage = () => {
    const navigate = useNavigate();
    const [activeSlide, setActiveSlide] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, password, confirmPassword } = form;
        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await API.post('/auth/register', { name, email, password });
            toast.success('Account created! Check terminal for your OTP.');
            navigate('/verify-otp', { state: { email } });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                        <h1 className="auth-title">Create Account</h1>
                        <p className="auth-subtitle">Sign up to get started today.</p>

                        <form onSubmit={handleSubmit} className="auth-form">
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={form.name}
                                onChange={handleChange}
                                className="input-field"
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={handleChange}
                                className="input-field"
                            />

                            <PasswordInput
                                id="signup-password"
                                name="password"
                                placeholder="Password"
                                value={form.password}
                                onChange={handleChange}
                            />
                            <PasswordStrength password={form.password} />

                            <PasswordInput
                                id="signup-confirm"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="register-row">
                            Already have an account?{' '}
                            <Link to="/login" className="register-link">Login</Link>
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

export default SignupPage;
