import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import PasswordInput from '../components/PasswordInput';

const ProfilePage = () => {
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('profile');

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await API.put('/auth/profile', { name });
            login({ ...user, name }, localStorage.getItem('token'));
            toast.success('Name updated!');
        } catch {
            toast.error('Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirm) { toast.error("Passwords don't match"); return; }
        if (passwords.newPass.length < 6) { toast.error("Minimum 6 characters"); return; }
        setSaving(true);
        try {
            await API.put('/auth/change-password', { currentPassword: passwords.current, newPassword: passwords.newPass });
            setPasswords({ current: '', newPass: '', confirm: '' });
            toast.success('Password changed!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <h1 className="page-title">My Profile</h1>

                {/* Profile Header */}
                <div className="profile-header">
                    <div className="profile-avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
                    <div>
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="profile-tabs">
                    {['profile', 'password'].map(t => (
                        <button key={t} className={`profile-tab ${tab === t ? 'profile-tab-active' : ''}`}
                            onClick={() => setTab(t)}>
                            {t === 'profile' ? '👤 Edit Profile' : '🔐 Change Password'}
                        </button>
                    ))}
                </div>

                <div className="profile-form-card">
                    {tab === 'profile' && (
                        <form onSubmit={handleNameUpdate} className="auth-form">
                            <label className="form-label">Full Name</label>
                            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
                            <label className="form-label">Email (read-only)</label>
                            <input className="input-field" value={user?.email} disabled style={{ opacity: 0.6 }} />
                            <button type="submit" className="btn-orange" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    )}

                    {tab === 'password' && (
                        <form onSubmit={handlePasswordChange} className="auth-form">
                            <label className="form-label">Current Password</label>
                            <PasswordInput id="cur-pass" name="current" placeholder="Current Password"
                                value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} />
                            <label className="form-label">New Password</label>
                            <PasswordInput id="new-pass" name="newPass" placeholder="New Password"
                                value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} />
                            <label className="form-label">Confirm New Password</label>
                            <PasswordInput id="conf-pass" name="confirm" placeholder="Confirm Password"
                                value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
                            <button type="submit" className="btn-orange" disabled={saving}>
                                {saving ? 'Changing...' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
