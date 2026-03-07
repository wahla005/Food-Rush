import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiStar, FiClock, FiArrowRight, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const CATEGORIES = [
    { name: 'Burgers', emoji: '🍔' },
    { name: 'Pizza', emoji: '🍕' },
    { name: 'Desi', emoji: '🍛' },
    { name: 'Chinese', emoji: '🥡' },
    { name: 'BBQ', emoji: '🔥' },
    { name: 'Desserts', emoji: '🍦' },
    { name: 'Drinks', emoji: '🥤' },
    { name: 'Sides', emoji: '🍟' },
];

const HomePage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rRes, fRes] = await Promise.all([
                    API.get('/restaurants'),
                    API.get('/foods?sort=rating'),
                ]);
                setRestaurants(rRes.data.slice(0, 4));
                setFeatured(fRes.data.slice(0, 6));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">

                {/* Hero */}
                <section className="hero-section">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            Hey {user?.name?.split(' ')[0]} 👋<br />
                            <span>What are you craving?</span>
                        </h1>
                        <p className="hero-subtitle">Order from the best restaurants near you, delivered fast.</p>
                        <div className="hero-offers">
                            <div className="offer-chip">🎉 Free delivery on first order</div>
                            <div className="offer-chip">⚡ 30-min delivery</div>
                        </div>
                        <button className="btn-orange" onClick={() => navigate('/menu')}>
                            Explore Menu <FiArrowRight />
                        </button>
                    </div>
                    <div className="hero-img">
                        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&q=80" alt="Food" />
                    </div>
                </section>

                {/* Categories */}
                <section className="section">
                    <h2 className="section-title">Browse by Category</h2>
                    <div className="category-grid">
                        {CATEGORIES.map(c => (
                            <button key={c.name} className="category-chip"
                                onClick={() => navigate(`/menu?category=${c.name}`)}>
                                <span className="cat-emoji">{c.emoji}</span>
                                <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                </section>


                {/* Popular Restaurants */}
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Popular Restaurants</h2>
                        <Link to="/restaurants" className="see-all">See all →</Link>
                    </div>
                    {loading ? (
                        <div className="loading-grid">
                            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : (
                        <div className="restaurant-grid">
                            {restaurants.map(r => (
                                <Link key={r._id} to={`/restaurant/${r._id}`} className="restaurant-card">
                                    <div className="rest-img-wrap">
                                        <img src={r.image} alt={r.name} />
                                        {r.isOpen ? <span className="open-badge">Open</span> : <span className="closed-badge">Closed</span>}
                                    </div>
                                    <div className="rest-info">
                                        <h3>{r.name}</h3>
                                        <p>{r.cuisine.join(', ')}</p>
                                        <div className="rest-meta">
                                            <span><FiStar size={13} /> {r.rating}</span>
                                            <span><FiClock size={13} /> {r.deliveryTime}</span>
                                            <span><FiTruck size={13} /> Rs. {r.deliveryFee}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Featured Dishes */}
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">🌟 Top Rated Dishes</h2>
                        <Link to="/menu" className="see-all">See all →</Link>
                    </div>
                    {loading ? (
                        <div className="loading-grid">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : (
                        <div className="food-grid">
                            {featured.map(f => (
                                <Link key={f._id} to={`/food/${f._id}`} className="food-card">
                                    <img src={f.image} alt={f.name} className="food-card-img" />
                                    <div className="food-card-body">
                                        {f.isVeg && <span className="veg-dot" />}
                                        <h4>{f.name}</h4>
                                        <p>{f.description?.slice(0, 50)}...</p>
                                        <div className="food-card-footer">
                                            <span className="food-price">Rs. {f.price}</span>
                                            <span className="food-rating"><FiStar size={12} /> {f.rating}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default HomePage;
