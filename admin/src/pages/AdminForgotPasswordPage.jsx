import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiLock, FiMail, FiShield, FiArrowLeft, FiCheckCircle, FiKey } from 'react-icons/fi';
import API from '../api/axios';
import PasswordInput from '../components/PasswordInput';

const AdminForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(600);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your admin email');
        setLoading(true);
        try {
            await API.post('/admin/forgot-password', { email });
            toast.success('OTP sent to your email!');
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const copy = [...otp];
        copy[idx] = val;
        setOtp(copy);
        if (val && idx < 5) document.getElementById(`admin-otp-${idx + 1}`)?.focus();
    };

    const handleOtpKey = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0)
            document.getElementById(`admin-otp-${idx - 1}`)?.focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length < 6) return toast.error('Please enter the 6-digit OTP');
        setLoading(true);
        try {
            await API.post('/admin/verify-otp', { email, otp: otpStr });
            toast.success('OTP verified! You can now reset your password.');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) return toast.error('Please fill in all fields');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

        setLoading(true);
        try {
            await API.post('/admin/reset-password', { email, otp: otp.join(''), newPassword });
            toast.success('Password reset successfully! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-bg">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>

            <div className="admin-login-card">
                <div className="admin-login-icon-wrap" style={{ position: 'relative' }}>
                    <div className="admin-login-icon">
                        {step === 1 && <FiMail size={32} />}
                        {step === 2 && <FiKey size={32} />}
                        {step === 3 && <FiLock size={32} />}
                    </div>
                    <button 
                        onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
                        style={{ position: 'absolute', left: '-10px', top: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                        <FiArrowLeft size={18} />
                    </button>
                </div>

                <h1 className="admin-login-title">
                    {step === 1 && 'Forgot Password?'}
                    {step === 2 && 'Verify OTP'}
                    {step === 3 && 'Reset Password'}
                </h1>
                <p className="admin-login-subtitle">
                    {step === 1 && "Enter your admin email to receive a reset code."}
                    {step === 2 && `We've sent a 6-digit code to ${email}`}
                    {step === 3 && "Set a new secure password for your admin account."}
                </p>

                {step === 1 && (
                    <form onSubmit={handleSendOtp} className="admin-login-form">
                        <div className="admin-input-group">
                            <label className="admin-input-label">
                                <FiMail size={14} />
                                <span>Admin Email</span>
                            </label>
                            <input
                                type="email"
                                placeholder="Enter admin email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input-field"
                                required
                            />
                        </div>
                        <button type="submit" className="admin-login-btn" disabled={loading}>
                            {loading ? (
                                <span className="admin-btn-loading">
                                    <span className="spinner-sm" />
                                    Sending...
                                </span>
                            ) : (
                                'Send Reset OTP'
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="admin-login-form">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '1rem 0' }}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`admin-otp-${idx}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                                    onKeyDown={(e) => handleOtpKey(e, idx)}
                                    style={{
                                        width: '40px',
                                        height: '50px',
                                        textAlign: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: '700',
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            ))}
                        </div>
                        <button type="submit" className="admin-login-btn" disabled={loading}>
                            {loading ? (
                                <span className="admin-btn-loading">
                                    <span className="spinner-sm" />
                                    Verifying...
                                </span>
                            ) : (
                                'Verify & Continue'
                            )}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                            {canResend ? (
                                <button 
                                    type="button" 
                                    onClick={handleSendOtp}
                                    style={{ background: 'none', border: 'none', color: 'var(--purple)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Resend OTP
                                </button>
                            ) : (
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Resend in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                </p>
                            )}
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="admin-login-form">
                        <div className="admin-input-group">
                            <label className="admin-input-label">
                                <FiLock size={14} />
                                <span>New Password</span>
                            </label>
                            <PasswordInput
                                id="admin-new-password"
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div className="admin-input-group">
                            <label className="admin-input-label">
                                <FiCheckCircle size={14} />
                                <span>Confirm New Password</span>
                            </label>
                            <PasswordInput
                                id="admin-confirm-password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="admin-login-btn" disabled={loading}>
                            {loading ? (
                                <span className="admin-btn-loading">
                                    <span className="spinner-sm" />
                                    Resetting...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button 
                        onClick={() => navigate('/login')}
                        style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        Return to login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminForgotPasswordPage;
