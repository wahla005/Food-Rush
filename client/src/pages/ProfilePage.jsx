import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/image';
import PasswordInput from '../components/PasswordInput';
import { FiCamera, FiTrash2 } from 'react-icons/fi';

const ProfilePage = () => {
    const { user, login } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('profile');
    const [uploading, setUploading] = useState(false);
    const [showPicPopup, setShowPicPopup] = useState(false);
    const fileInputRef = useRef(null);

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Name cannot be empty');
            return;
        }
        setSaving(true);
        try {
            const { data } = await API.put('/auth/profile', { name: name.trim() });
            login(data.user, localStorage.getItem('token'));
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large (max 10MB for HD images)');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        setShowPicPopup(false); // Close popup after selection
        try {
            const { data } = await API.post('/auth/upload', formData);
            login(data.user, localStorage.getItem('token'));
            toast.success('Profile picture updated!');
        } catch (err) {
            console.error('Upload error details:', err.response?.data);
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleImageRemove = async () => {
        // if (!window.confirm('Remove profile picture?')) return; // Removed confirmation as per "popup" request often implies the popup IS the confirmation
        setUploading(true);
        setShowPicPopup(false); // Close popup after action
        try {
            const { data } = await API.delete('/auth/profile/image');
            login(data.user, localStorage.getItem('token'));
            toast.success('Profile picture removed');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to remove');
        } finally {
            setUploading(false);
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
                    <div className="profile-photo-management">
                        <div className="profile-avatar-wrapper" onClick={() => setShowPicPopup(true)}> {/* Updated click handler */}
                            <div className="profile-avatar-lg">
                                {user?.image ? (
                                    <img src={getImageUrl(user.image)} alt={user.name} className="profile-img-lg" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase()
                                )}
                                <div className="avatar-upload-overlay">
                                    {uploading ? '...' : <FiCamera size={18} />}
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        {/* Removed the direct remove photo button as it's now in the popup */}
                    </div>
                    <div>
                        <h2>{user?.name}</h2>
                        <p>{user?.email}</p>
                    </div>
                </div>

                {/* Profile Action Popup */}
                {showPicPopup && (
                    <div className="pic-action-overlay" onClick={() => setShowPicPopup(false)}>
                        <div className="pic-action-modal" onClick={e => e.stopPropagation()}>
                            <h3>Profile Picture</h3>
                            <button className="pic-action-btn change" onClick={() => fileInputRef.current.click()}>
                                {user?.image ? 'Change Picture' : 'Add Picture'}
                            </button>
                            {user?.image && (
                                <button className="pic-action-btn remove" onClick={handleImageRemove}>
                                    Remove Picture
                                </button>
                            )}
                            <button className="pic-action-btn cancel" onClick={() => setShowPicPopup(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

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
                            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
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
