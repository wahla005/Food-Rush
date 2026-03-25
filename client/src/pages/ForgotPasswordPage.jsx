import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import API from '../api/axios';

// Steps: 1 = email, 2 = otp, 3 = new password
const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(600);
    const [canResend, setCanResend] = useState(false);

    React.useEffect(() => {
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

    // -- Step 1: Send OTP --
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) { toast.error('Enter your email'); return; }
        setLoading(true);
        try {
            await API.post('/auth/forgot-password', { email });
            toast.success('OTP sent! Please check your email.');
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // OTP input helpers
    const handleOtpChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const copy = [...otp];
        copy[idx] = val;
        setOtp(copy);
        if (val && idx < 5) document.getElementById(`fotp-${idx + 1}`)?.focus();
    };
    const handleOtpKey = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0)
            document.getElementById(`fotp-${idx - 1}`)?.focus();
    };

    // -- Step 2: Verify OTP --
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length < 6) { toast.error('Enter all 6 digits'); return; }
        setLoading(true);
        try {
            await API.post('/auth/verify-reset-otp', { email, otp: otpStr });
            toast.success('OTP verified! Set your new password.');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            await API.post('/auth/resend-otp', { email, type: 'reset' });
            toast.success('New reset OTP sent to your email!');
            setTimer(600);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // -- Step 3: Reset Password --
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) { toast.error('Fill in all fields'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
        setLoading(true);
        try {
            await API.post('/auth/reset-password', { email, otp: otp.join(''), newPassword });
            toast.success('Password reset! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="otp-page">
            <div className="otp-card">
                {/* Step indicators */}
                <div className="step-indicator">
                    {['Email', 'Verify OTP', 'New Password'].map((label, i) => (
                        <div key={i} className={`step-item ${step === i + 1 ? 'step-active' : step > i + 1 ? 'step-done' : ''}`}>
                            <div className="step-circle">{step > i + 1 ? 'Done' : i + 1}</div>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Step 1 */}
                {step === 1 && (
                    <>
                        <div className="otp-icon"></div>
                        <h2 className="auth-title" style={{ textAlign: 'center' }}>Forgot Password?</h2>
                        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                            Enter your registered email and we'll send an OTP.
                        </p>
                        <form onSubmit={handleSendOtp} className="auth-form">
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                            />
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <>
                        <div className="otp-icon"></div>
                        <h2 className="auth-title" style={{ textAlign: 'center' }}>Enter OTP</h2>
                        <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                            We've sent a 6-digit code to your email.
                        </p>
                        <form onSubmit={handleVerifyOtp} className="otp-form">
                            <div className="otp-inputs">
                                {otp.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        id={`fotp-${idx}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                                        onKeyDown={(e) => handleOtpKey(e, idx)}
                                        className="otp-box"
                                    />
                                ))}
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </button>

                            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                                {canResend ? (
                                    <p className="register-row">
                                        Didn't receive code?{' '}
                                        <span className="register-link" style={{ cursor: 'pointer' }} onClick={handleResendOtp}>
                                            Resend OTP
                                        </span>
                                    </p>
                                ) : (
                                    <p className="auth-subtitle">Resend code in {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
                                )}
                            </div>
                        </form>
                    </>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <>
                        <div className="otp-icon"></div>
                        <h2 className="auth-title" style={{ textAlign: 'center' }}>Set New Password</h2>
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <PasswordInput
                                id="new-password"
                                name="newPassword"
                                placeholder="New Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <PasswordStrength password={newPassword} />
                            <PasswordInput
                                id="confirm-new-password"
                                name="confirmPassword"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                <p className="register-row" style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <span className="register-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/login')}>
                    {'<'} Back to Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
