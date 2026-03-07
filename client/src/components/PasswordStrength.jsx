import React from 'react';

const getStrength = (password) => {
    if (!password) return { label: '', score: 0, color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Very Weak', score: 1, color: '#ff2d2d' };
    if (score === 2) return { label: 'Weak', score: 2, color: '#ff8c00' };
    if (score === 3) return { label: 'Fair', score: 3, color: '#f5c518' };
    if (score === 4) return { label: 'Strong', score: 4, color: '#4caf50' };
    return { label: 'Very Strong', score: 5, color: '#00c853' };
};

const PasswordStrength = ({ password }) => {
    const { label, score, color } = getStrength(password);
    if (!password) return null;

    return (
        <div className="password-strength">
            <div className="strength-bars">
                {[1, 2, 3, 4, 5].map((s) => (
                    <div
                        key={s}
                        className="strength-bar"
                        style={{ backgroundColor: s <= score ? color : '#e0e0e0' }}
                    />
                ))}
            </div>
            <span className="strength-label" style={{ color }}>
                {label}
            </span>
        </div>
    );
};

export default PasswordStrength;
