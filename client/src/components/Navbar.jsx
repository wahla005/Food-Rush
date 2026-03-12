import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiSearch, FiMenu, FiX, FiLogOut, FiPackage, FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { itemCount } = useCart();
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (search.trim()) navigate(`/menu?search=${encodeURIComponent(search.trim())}`);
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out!');
        navigate('/login');
    };

    const navLinks = [
        { to: '/home', label: 'Home' },
        { to: '/menu', label: 'Menu' },
        { to: '/restaurants', label: 'Restaurants' },
        { to: '/orders', label: 'My Orders' },
    ];

    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <nav className="navbar">
            <div className="nav-inner">
                {/* Logo */}
                <Link to="/home" className="nav-logo">
                    🍔 <span>FoodRush</span>
                </Link>

                {/* Search */}
                <form className="nav-search" onSubmit={handleSearch}>
                    <FiSearch size={16} />
                    <input
                        type="text"
                        placeholder="Search dishes, restaurants..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </form>

                {/* Desktop links */}
                <div className="nav-links">
                    {navLinks.map(l => (
                        <Link key={l.to} to={l.to}
                            className={`nav-link ${location.pathname === l.to ? 'nav-link-active' : ''}`}>
                            {l.label}
                        </Link>
                    ))}
                </div>

                {/* Cart + Profile */}
                <div className="nav-actions">
                    <button onClick={toggleTheme} className="cart-btn" style={{ background: 'transparent', color: isDarkMode ? '#fcd34d' : '#6b7280' }} title="Toggle Theme">
                        {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>
                    <Link to="/cart" className="cart-btn">
                        <FiShoppingCart size={20} />
                        {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                    </Link>

                    {/* Profile dropdown — uses click-outside ref, NOT onMouseLeave */}
                    <div className="profile-menu" ref={dropdownRef}>
                        <button className="profile-btn" onClick={() => setProfileOpen(p => !p)}>
                            <div className="avatar-circle">
                                {user?.image ? (
                                    <img src={`http://localhost:5001${user.image}`} alt={user.name} className="avatar-img" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase() || 'U'
                                )}
                            </div>
                        </button>
                        {profileOpen && (
                            <div className="dropdown">
                                <div className="dropdown-header">
                                    <p className="dropdown-name">{user?.name}</p>
                                    <p className="dropdown-email">{user?.email}</p>
                                </div>
                                <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                                    <FiUser size={15} /> Profile
                                </Link>
                                <Link to="/orders" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                                    <FiPackage size={15} /> My Orders
                                </Link>

                                <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                                    <FiLogOut size={15} /> Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button className="hamburger" onClick={() => setMenuOpen(p => !p)}>
                        {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    {navLinks.map(l => (
                        <Link key={l.to} to={l.to} className="mobile-link" onClick={() => setMenuOpen(false)}>
                            {l.label}
                        </Link>
                    ))}

                    <Link to="/profile" className="mobile-link" onClick={() => setMenuOpen(false)}>👤 Profile</Link>
                    <button
                        className="mobile-link"
                        style={{ color: '#ef4444', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', width: '100%', padding: '0.75rem 1.5rem' }}
                        onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
