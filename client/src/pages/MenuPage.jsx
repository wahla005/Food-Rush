import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiStar, FiFilter } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import API from '../api/axios';

import { getImageUrl } from '../utils/image';
import { getPromoPrice, hasPizzaPromo } from '../utils/promo';


const MenuPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [foods, setFoods] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
    const [sort, setSort] = useState('');
    const [vegOnly, setVegOnly] = useState(false);
    const { addToCart, restaurantId } = useCart();

    const fetchFoods = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeCategory !== 'All') params.set('category', activeCategory);
            if (sort) params.set('sort', sort);
            if (vegOnly) params.set('isVeg', 'true');
            const search = searchParams.get('search');
            if (search) params.set('search', search);
            const { data } = await API.get(`/foods?${params}`);
            setFoods(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await API.get('/categories');
            setCategories(['All', ...data.map(c => c.name)]);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFoods();
        fetchCategories();
    }, [activeCategory, sort, vegOnly, searchParams]);

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <div className="menu-header">
                    <h1 className="page-title">Our Menu</h1>
                    {searchParams.get('search') && (
                        <p className="search-result-label">Results for: "<strong>{searchParams.get('search')}</strong>"</p>
                    )}

                    {/* Filters */}
                    <div className="menu-filters">
                        <div className="filter-row">
                            <FiFilter size={16} />
                            <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
                                <option value="">Sort by</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="rating">Top Rated</option>
                            </select>
                            <label className="veg-toggle">
                                <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} />
                                Veg Only
                            </label>
                        </div>
                    </div>
                </div>

                {/* Category tabs */}
                <div className="category-tabs">
                    {categories.map(c => (
                        <button
                            key={c}
                            className={`cat-tab ${activeCategory === c ? 'cat-tab-active' : ''}`}
                            onClick={() => setActiveCategory(c)}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {/* Food Grid */}
                {loading ? (
                    <div className="food-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-card food-skeleton" />)}
                    </div>
                ) : foods.length === 0 ? (
                    <div className="empty-state">
                        <p>No items found</p>
                        <button className="btn-orange" onClick={() => { setActiveCategory('All'); setVegOnly(false); setSort(''); }}>
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="food-grid">
                        {foods.map(f => {
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
                                                Pizza SPECIAL
                                            </span>
                                        )}
                                    </Link>
                                    <div className="food-card-body">
                                        <div className="food-card-top">
                                            {f.isVeg ? <span className="veg-badge">Veg</span> : <span className="nonveg-badge">Non-Veg</span>}
                                        </div>
                                        <Link to={`/food/${f._id}`}><h4>{f.name}</h4></Link>
                                        <p className="food-desc">{f.description?.slice(0, 55)}...</p>
                                        <p className="food-restaurant">{f.restaurant?.name}</p>
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
                                        <div className="food-card-buttons">
                                            <button
                                                className="btn-buy-now"
                                                onClick={() => navigate('/checkout', {
                                                    state: {
                                                        directItem: {
                                                            ...f,
                                                            quantity: 1,
                                                            restaurantId: f.restaurant?._id || f.restaurant,
                                                            restaurantName: f.restaurant?.name || ''
                                                        }
                                                    }
                                                })}
                                            >
                                                Buy Now
                                            </button>
                                            <button
                                                className="btn-add-cart"
                                                onClick={() => addToCart(f, f.restaurant?._id || f.restaurant, f.restaurant?.name)}
                                            >
                                                + Cart
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MenuPage;
