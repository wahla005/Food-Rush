import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getImageUrl } from '../utils/image';

const OrderConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = location.state?.order;

    React.useEffect(() => {
        if (!order) navigate('/home');
    }, [order, navigate]);

    if (!order) return null;

    const statusSteps = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered'];
    const currentStep = statusSteps.indexOf(order.status);

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <div className="confirm-card">
                    <div className="confirm-icon"></div>
                    <h1>Order Placed!</h1>
                    <p className="confirm-subtitle">Your order has been received. We'll start preparing it shortly.</p>

                    <div className="order-number">
                        <span>Order #</span>
                        <strong>{order.dailyOrderNumber ? `#${order.dailyOrderNumber}` : order._id?.slice(-8).toUpperCase()}</strong>
                    </div>

                    <div className="delivery-eta">
                        <span>Estimated Delivery</span>
                        <strong>{order.estimatedDelivery}</strong>
                    </div>

                    {/* Status tracker */}
                    <div className="order-tracker">
                        {statusSteps.slice(0, 4).map((step, i) => (
                            <React.Fragment key={step}>
                                <div className={`tracker-step ${i <= currentStep ? 'tracker-active' : ''}`}>
                                    <div className="tracker-dot">{i <= currentStep ? '✓' : i + 1}</div>
                                    <span>{step}</span>
                                </div>
                                {i < 3 && <div className={`tracker-line ${i < currentStep ? 'tracker-line-active' : ''}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Order items */}
                    <div className="confirm-items">
                        <h3>Items Ordered</h3>
                        {order.items?.map((item, i) => (
                            <div key={i} className="confirm-item">
                                <img src={getImageUrl(item.image)} alt={item.name} className="confirm-item-img" />
                                <span>{item.name} × {item.quantity}</span>
                                <span>Rs. {item.price * item.quantity}</span>
                            </div>
                        ))}
                        <div className="confirm-total">
                            <span>Total Paid</span>
                            <strong>Rs. {order.total}</strong>
                        </div>
                    </div>

                    <div className="confirm-actions">
                        <Link to="/orders" className="btn-orange">Track Orders</Link>
                        <Link to="/menu" className="btn-outline">Order More</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderConfirmationPage;
