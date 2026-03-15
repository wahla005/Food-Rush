import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';

const OtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (val, idx) => {
        if (!/^\d?$/.test(val)) return;
        const copy = [...otp];
        copy[idx] = val;
        setOtp(copy);
        if (val && idx < 5) {
            document.getElementById(`otp-${idx + 1}`)?.focus();
        }
    };

    const handleKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            document.getElementById(`otp-${idx - 1}`)?.focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpStr = otp.join('');
        if (otpStr.length < 6) {
            toast.error('Please enter all 6 digits');
            return;
        }
        setLoading(true);
        try {
            await API.post('/auth/verify-otp', { email, otp: otpStr });
            toast.success('✅ Account verified! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        try {
            await API.post('/auth/resend-otp', { email, type: 'register' });
            toast.success('New OTP sent to your email!');
            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="otp-page">
            <div className="otp-card">
                <div className="otp-icon">📬</div>
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Verify Your Email</h2>
                <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                    Enter the 6-digit OTP sent to your email.
                    <br />
                    <span className="email-highlight">{email}</span>
                </p>

                <form onSubmit={handleVerify} className="otp-form">
                    <div className="otp-inputs">
                        {otp.map((digit, idx) => (
                            <input
                                key={idx}
                                id={`otp-${idx}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e.target.value, idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                className="otp-box"
                            />
                        ))}
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="otp-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    {canResend ? (
                        <p className="register-row">
                            Didn't receive code?{' '}
                            <span className="register-link" style={{ cursor: 'pointer' }} onClick={handleResend}>
                                Resend OTP
                            </span>
                        </p>
                    ) : (
                        <p className="auth-subtitle">Resend code in {timer}s</p>
                    )}

                    <p className="register-row" style={{ marginTop: '1rem' }}>
                        Wrong email?{' '}
                        <span
                            className="register-link"
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/signup')}
                        >
                            Go back
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OtpPage;

export default OtpPage;
