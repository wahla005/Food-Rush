import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { useGoogleLogin } from '@react-oauth/google';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const slides = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
];

const SignupPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [activeSlide, setActiveSlide] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (response) => {
            setGoogleLoading(true);
            try {
                // Get user info from Google
                const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`);
                const googleUser = await res.json();

                // Send to backend
                const { data } = await API.post('/auth/google', {
                    googleId: googleUser.sub,
                    email: googleUser.email,
                    name: googleUser.name
                });

                login(data.user, data.token);
                toast.success(`Welcome, ${data.user.name}!`);
                navigate('/home');
            } catch (err) {
                console.error(err);
                toast.error('Google signup failed');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => toast.error('Google signup failed')
    });

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
                {/* -- Left Panel -- */}
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

                        {/* Divider */}
                        <div className="divider">
                            <span className="divider-line" />
                            <span className="divider-text">or signup with</span>
                            <span className="divider-line" />
                        </div>

                        {/* Google button */}
                        <button
                            type="button"
                            className="btn-social"
                            onClick={() => handleGoogleLogin()}
                            disabled={googleLoading}
                        >
                            <FcGoogle size={22} />
                            <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                        </button>

                        <p className="register-row">
                            Already have an account?{' '}
                            <Link to="/login" className="register-link">Login</Link>
                        </p>
                    </div>
                </div>

                {/* -- Right Panel -- */}
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
