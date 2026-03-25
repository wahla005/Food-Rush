import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiClock, FiTruck } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { getImageUrl } from '../utils/image';

const RestaurantsPage = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/restaurants').then(r => { setRestaurants(r.data); setLoading(false); });
    }, []);

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <h1 className="page-title">All Restaurants</h1>
                {loading ? (
                    <div className="restaurant-grid">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-card" />)}
                    </div>
                ) : (
                    <div className="restaurant-grid">
                        {restaurants.map(r => (
                            <Link key={r._id} to={`/restaurant/${r._id}`} className="restaurant-card">
                                <div className="rest-img-wrap">
                                    <img src={getImageUrl(r.image)} alt={r.name} />
                                    {r.isOpen ? <span className="open-badge">Open</span> : <span className="closed-badge">Closed</span>}
                                </div>
                                <div className="rest-info">
                                    <h3>{r.name}</h3>
                                    <p>{r.cuisine.join(', ')}</p>
                                    <p className="rest-address">📍 {r.address}</p>
                                    <div className="rest-meta">
                                        <span><FiStar size={13} /> {r.rating}</span>
                                        <span><FiClock size={13} /> {r.deliveryTime}</span>
                                        <span><FiTruck size={13} /> Rs. {r.deliveryFee} delivery</span>
                                    </div>
                                    <p className="rest-min">Min. order: Rs. {r.minOrder}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RestaurantsPage;
