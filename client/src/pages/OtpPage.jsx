import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';

const OtpPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="otp-page">
            <div className="otp-card">
                <div className="otp-icon">📬</div>
                <h2 className="auth-title" style={{ textAlign: 'center' }}>Verify Your Email</h2>
                <p className="auth-subtitle" style={{ textAlign: 'center' }}>
                    Enter the 6-digit OTP from your <strong>server terminal</strong>.
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

                <p className="register-row" style={{ textAlign: 'center', marginTop: '1rem' }}>
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
    );
};

export default OtpPage;
