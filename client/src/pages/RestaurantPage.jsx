import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiClock, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import API from '../api/axios';

import { getPromoPrice, hasPizzaPromo } from '../utils/promo';

const RestaurantPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        API.get(`/restaurants/${id}`).then(r => { setData(r.data); setLoading(false); });
    }, [id]);

    if (loading) return <div className="app-page"><Navbar /><div className="loading-center">Loading...</div></div>;
    if (!data) return null;

    const { restaurant, foods } = data;
    const categories = ['All', ...new Set(foods.map(f => f.category))];
    const filtered = activeCategory === 'All' ? foods : foods.filter(f => f.category === activeCategory);

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                {/* Restaurant Hero */}
                <div className="rest-hero">
                    <img src={restaurant.image} alt={restaurant.name} className="rest-hero-img" />
                    <div className="rest-hero-overlay">
                        <h1>{restaurant.name}</h1>
                        <p>{restaurant.description}</p>
                        <div className="rest-hero-meta">
                            <span><FiStar /> {restaurant.rating}</span>
                            <span><FiClock /> {restaurant.deliveryTime}</span>
                            <span><FiTruck /> Rs. {restaurant.deliveryFee} delivery</span>
                            <span>Min: Rs. {restaurant.minOrder}</span>
                        </div>
                    </div>
                </div>

                {/* Category tabs */}
                <div className="category-tabs" style={{ marginTop: '1.5rem' }}>
                    {categories.map(c => (
                        <button key={c} className={`cat-tab ${activeCategory === c ? 'cat-tab-active' : ''}`}
                            onClick={() => setActiveCategory(c)}>{c}</button>
                    ))}
                </div>

                {/* Food items */}
                <div className="food-grid" style={{ marginTop: '1.5rem' }}>
                    {filtered.map(f => {
                        const disc = f.discount || 0;
                        const finalPrice = getPromoPrice(f);
                        const isPizza = hasPizzaPromo(f);
                        const hasAnyDiscount = finalPrice < f.price;

                        return (
                            <div key={f._id} className="food-card">
                                <Link to={`/food/${f._id}`} style={{ position: 'relative', display: 'block' }}>
                                    <img src={f.image} alt={f.name} className="food-card-img" />
                                    {disc > 0 && (
                                        <span className="discount-badge-card">{disc}% OFF</span>
                                    )}
                                    {isPizza && (
                                        <span style={{
                                            position: 'absolute', top: 10, left: 10,
                                            background: '#f59e0b', color: 'white',
                                            fontSize: '0.65rem', fontWeight: 800,
                                            padding: '0.2rem 0.5rem', borderRadius: 4,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}>
                                            🍕 Pizza SPECIAL
                                        </span>
                                    )}
                                </Link>
                                <div className="food-card-body">
                                    {f.isVeg ? <span className="veg-badge">🌿 Veg</span> : <span className="nonveg-badge">🍖 Non-Veg</span>}
                                    <Link to={`/food/${f._id}`}><h4>{f.name}</h4></Link>
                                    <p className="food-desc">{f.description?.slice(0, 55)}...</p>
                                    <div className="food-card-footer">
                                        {hasAnyDiscount ? (
                                            <span>
                                                <span className="food-price-original">Rs. {f.price}</span>
                                                <span className="food-price food-price-discounted">Rs. {finalPrice}</span>
                                            </span>
                                        ) : (
                                            <span className="food-price">Rs. {f.price}</span>
                                        )}
                                        <span className="food-rating"><FiStar size={12} /> {f.rating}</span>
                                    </div>
                                    <button className="btn-add-cart" onClick={() => addToCart(f, restaurant._id, restaurant.name)}>
                                        + Add to Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default RestaurantPage;
