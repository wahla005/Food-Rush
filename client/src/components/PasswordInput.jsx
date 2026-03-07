import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const PasswordInput = ({ id, name, placeholder, value, onChange, className }) => {
    const [show, setShow] = useState(false);

    return (
        <div className="password-wrapper">
            <input
                type={show ? 'text' : 'password'}
                id={id}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`input-field ${className || ''}`}
                autoComplete="current-password"
            />
            <button
                type="button"
                className="eye-btn"
                onClick={() => setShow((p) => !p)}
                tabIndex={-1}
                aria-label={show ? 'Hide password' : 'Show password'}
            >
                {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
        </div>
    );
};

export default PasswordInput;
