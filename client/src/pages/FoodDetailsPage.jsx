import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiStar, FiMinus, FiPlus, FiClock, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/image';
import { getPromoPrice, hasPizzaPromo } from '../utils/promo';

const FoodDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const [food, setFood] = useState(null);
    const [qty, setQty] = useState(1);
    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState({ rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        API.get(`/foods/${id}`).then(r => { setFood(r.data); setLoading(false); });
    }, [id]);

    const handleAddToCart = () => {
        for (let i = 0; i < qty; i++) addToCart(food, food.restaurant?._id || food.restaurant, food.restaurant?.name || '');
    };

    // Compute discounted price (Admin discount + Pizza promo)
    const disc = food?.discount || 0;
    const effectivePrice = getPromoPrice(food);
    const isPizzaPromo = hasPizzaPromo(food);

    const handleReview = async (e) => {
        e.preventDefault();
        if (!user) { toast.error('Login to add a review'); return; }
        setSubmitting(true);
        try {
            const { data } = await API.post(`/foods/${id}/review`, review);
            setFood(data.food);
            setReview({ rating: 5, comment: '' });
            toast.success('Review added!');
        } catch (err) {
            toast.error('Failed to add review');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="app-page"><Navbar /><div className="loading-center">Loading...</div></div>;
    if (!food) return null;

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <div className="food-detail-grid">
                    {/* Image */}
                    <div className="food-detail-img-wrap">
                        <img src={getImageUrl(food.image)} alt={food.name} className="food-detail-img" />
                        {food.isVeg ? <span className="veg-badge big-badge">🌿 Veg</span> : <span className="nonveg-badge big-badge">🍖 Non-Veg</span>}
                        {disc > 0 && <span className="discount-badge-detail">{disc}% OFF</span>}
                    </div>

                    {/* Info */}
                    <div className="food-detail-info">
                        <h1 className="food-detail-title">{food.name}</h1>
                        <p className="food-detail-desc">{food.description}</p>

                        <div className="food-detail-meta">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                {[1, 2, 3, 4, 5].map(n => (
                                    <FiStar
                                        key={n}
                                        size={16}
                                        fill={n <= Math.round(food.rating) ? "#f59e0b" : "none"}
                                        stroke={n <= Math.round(food.rating) ? "#f59e0b" : "rgba(0,0,0,0.2)"}
                                    />
                                ))}
                                <span style={{ marginLeft: '0.4rem' }}>{food.rating} ({food.reviews?.length || 0} reviews)</span>
                            </span>
                            <span><FiClock /> {food.restaurant?.deliveryTime}</span>
                            <span><FiTruck /> Rs. {food.restaurant?.deliveryFee} delivery</span>
                        </div>

                        {/* Ingredients */}
                        {food.ingredients?.length > 0 && (
                            <div className="ingredients-section">
                                <h3>Ingredients</h3>
                                <div className="ingredients-list">
                                    {food.ingredients.map(ing => <span key={ing} className="ingredient-chip">{ing}</span>)}
                                </div>
                            </div>
                        )}

                        {/* Price + Quantity + Add */}
                        <div className="food-detail-order">
                            <div>
                                {disc > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                        <span style={{ color: '#9ca3af', textDecoration: 'line-through', fontSize: '1rem' }}>Rs. {food.price * qty}</span>
                                        <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '0.78rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: 50 }}>{disc}% OFF</span>
                                    </div>
                                )}
                                {isPizzaPromo && (
                                    <div style={{ background: '#fff7ed', color: '#ea580c', fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.75rem', borderRadius: 8, marginBottom: '0.5rem', display: 'inline-block' }}>
                                        🍕 PIZZA SPECIAL: Extra 25% OFF applied
                                    </div>
                                )}
                                <span className="food-detail-price">Rs. {effectivePrice * qty}</span>
                            </div>
                            <div className="qty-selector">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus /></button>
                                <span>{qty}</span>
                                <button onClick={() => setQty(q => q + 1)}><FiPlus /></button>
                            </div>
                            <div className="food-detail-buttons">
                                <button
                                    className="btn-orange"
                                    style={{ flex: 1 }}
                                    onClick={() => navigate('/checkout', {
                                        state: {
                                            directItem: {
                                                ...food,
                                                quantity: qty,
                                                restaurantId: food.restaurant?._id || food.restaurant,
                                                restaurantName: food.restaurant?.name || ''
                                            }
                                        }
                                    })}
                                >
                                    Buy Now — Rs. {effectivePrice * qty}
                                </button>
                                <button className="btn-add-cart-outline" onClick={handleAddToCart}>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews */}
                <section className="reviews-section">
                    <h2>Reviews & Ratings</h2>

                    {/* Reviews List */}
                    <div className="reviews-list">
                        {food.reviews?.length === 0 ? (
                            <p className="no-reviews">No reviews yet.</p>
                        ) : (
                            food.reviews?.map((rev, i) => (
                                <div key={i} className="review-item">
                                    <div className="review-header">
                                        <div className="review-avatar">{rev.userName?.[0]?.toUpperCase()}</div>
                                        <div>
                                            <p className="review-name">{rev.userName}</p>
                                            <div className="review-stars">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                                        </div>
                                    </div>
                                    <p className="review-comment">{rev.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FoodDetailsPage;
