import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiStar, FiClock, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import API from '../api/axios';
import { getImageUrl } from '../utils/image';
import { getPromoPrice, hasPizzaPromo } from '../utils/promo';

const RestaurantPage = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchRestData = async () => {
            try {
                const [restRes, reviewsRes] = await Promise.all([
                    API.get(`/restaurants/${id}`),
                    API.get(`/reviews/restaurant/${id}`)
                ]);
                setData(restRes.data);
                setReviews(reviewsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRestData();
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
                    <img src={getImageUrl(restaurant.image)} alt={restaurant.name} className="rest-hero-img" />
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
                                    <img src={getImageUrl(f.image)} alt={f.name} className="food-card-img" />
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
                                        <div className="food-rating" style={{ display: 'flex', gap: '0.1rem', alignItems: 'center' }}>
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <FiStar
                                                    key={n}
                                                    size={12}
                                                    fill={n <= Math.round(f.rating) ? "#f59e0b" : "none"}
                                                    stroke={n <= Math.round(f.rating) ? "#f59e0b" : "rgba(0,0,0,0.2)"}
                                                />
                                            ))}
                                            <span style={{ fontSize: '0.75rem', marginLeft: '0.3rem', color: 'rgba(0,0,0,0.5)' }}>({f.rating || 0})</span>
                                        </div>
                                    </div>
                                    <div className="food-card-buttons">
                                        <button
                                            className="btn-buy-now"
                                            onClick={() => navigate('/checkout', {
                                                state: {
                                                    directItem: {
                                                        ...f,
                                                        quantity: 1,
                                                        restaurantId: restaurant._id,
                                                        restaurantName: restaurant.name || ''
                                                    }
                                                }
                                            })}
                                        >
                                            Buy Now
                                        </button>
                                        <button className="btn-add-cart" onClick={() => addToCart(f, restaurant._id, restaurant.name)}>
                                            + Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reviews Section */}
                <div className="reviews-section" style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiStar fill="#f59e0b" stroke="#f59e0b" /> Customer Reviews ({reviews.length})
                    </h2>
                    {reviews.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No reviews yet. Be the first to rate!</p>
                    ) : (
                        <div className="reviews-list" style={{ display: 'grid', gap: '1rem' }}>
                            {reviews.map(rev => (
                                <div key={rev._id} className="review-card" style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '1.2rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{rev.user?.name || 'Anonymous'}</span>
                                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                            {new Date(rev.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.5rem' }}>
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <FiStar
                                                key={n}
                                                size={14}
                                                fill={n <= rev.rating ? "#f59e0b" : "none"}
                                                stroke={n <= rev.rating ? "#f59e0b" : "rgba(255,255,255,0.3)"}
                                            />
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>{rev.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default RestaurantPage;
