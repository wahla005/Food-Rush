import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

// ─── Promo rules ────────────────────────────────────────────────────────────
// Rule 1: Free delivery on first order (checked server-side via order history)
// Rule 2: Today's Special — extra 25% off Pizza items whose base price > Rs. 1500
// ─────────────────────────────────────────────────────────────────────────────

import { getPromoPrice, hasPizzaPromo } from '../utils/promo';

const BASE_DELIVERY_FEE = 59;

const CheckoutPage = () => {
    const location = useLocation();
    const directItem = location.state?.directItem;

    const { cart, total, clearCart, restaurantId: cartRestId, restaurantName: cartRestName } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const orderPlaced = React.useRef(false);

    const [loading, setLoading] = useState(false);
    const [isFirstOrder, setIsFirstOrder] = useState(false);
    const [promoLoading, setPromoLoading] = useState(true);

    const [form, setForm] = useState({
        fullName: user?.name || '',
        phone: '',
        address: '',
        city: '',
        paymentMethod: 'COD',
    });

    // ── Check first-order status ──────────────────────────────────────────
    useEffect(() => {
        const checkFirstOrder = async () => {
            try {
                const { data } = await API.get('/orders/my');
                setIsFirstOrder(data.length === 0);
            } catch {
                setIsFirstOrder(false);
            } finally {
                setPromoLoading(false);
            }
        };
        checkFirstOrder();
    }, []);

    // ── Decide what items to checkout ──────────────────────────────────────────
    const itemsToProcess = directItem ? [directItem] : cart;
    const checkoutRestId = directItem ? directItem.restaurantId : cartRestId;
    const checkoutRestName = directItem ? directItem.restaurantName : cartRestName;

    // ── Compute per-item final prices (admin discount + Pizza promo stacked) ──
    const enrichedCart = itemsToProcess.map(item => {
        const finalPrice = getPromoPrice(item);
        const hasPizzaPromoActive = hasPizzaPromo(item);
        return { ...item, finalPrice, hasPizzaPromo: hasPizzaPromoActive };
    });

    const subtotal = enrichedCart.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
    const deliveryFee = isFirstOrder ? 0 : BASE_DELIVERY_FEE;
    const grandTotal = subtotal + deliveryFee;

    // ── Count active promos for display ──────────────────────────────────
    const pizzaPromoItems = enrichedCart.filter(i => i.hasPizzaPromo);

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleOrder = async (e) => {
        e.preventDefault();
        if (!form.phone || !form.address || !form.city) { toast.error('Fill in all fields'); return; }
        setLoading(true);
        try {
            const items = enrichedCart.map(i => ({
                food: i._id,
                name: i.name,
                image: i.image,
                price: i.finalPrice,          // fully discounted unit price
                originalPrice: i.price,
                discount: i.discount || 0,
                quantity: i.quantity,
            }));

            const { data } = await API.post('/orders', {
                restaurant: checkoutRestId,
                restaurantName: checkoutRestName,
                items,
                subtotal,
                deliveryFee,
                total: grandTotal,
                deliveryAddress: { fullName: form.fullName, phone: form.phone, address: form.address, city: form.city },
                paymentMethod: form.paymentMethod,
                promos: {
                    freeDelivery: isFirstOrder,
                    pizzaDiscount: pizzaPromoItems.length > 0,
                },
            });

            orderPlaced.current = true;
            clearCart();
            navigate('/order-confirmation', { state: { order: data } });
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to place order';
            toast.error(msg, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!directItem && cart.length === 0 && !orderPlaced.current) navigate('/cart');
    }, [cart.length, directItem]);

    if (!directItem && cart.length === 0 && !orderPlaced.current) return null;

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <h1 className="page-title">Checkout</h1>

                {/* ── Active Promo Banners ── */}
                {!promoLoading && (isFirstOrder || pizzaPromoItems.length > 0) && (
                    <div className="promo-banners">
                        {isFirstOrder && (
                            <div className="promo-banner promo-green">
                                🎉 <strong>Free Delivery applied!</strong> Your first order — no delivery charges.
                            </div>
                        )}
                        {pizzaPromoItems.length > 0 && (
                            <div className="promo-banner promo-orange" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                🍕 <strong>Today's Special —</strong> Extra 25% OFF applied on:{' '}
                                {pizzaPromoItems.map(i => i.name).join(', ')}
                            </div>
                        )}
                    </div>
                )}

                <div className="checkout-layout">
                    {/* Form */}
                    <form onSubmit={handleOrder} className="checkout-form">
                        <h3>📍 Delivery Address</h3>
                        <div className="form-row">
                            <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className="input-field" required />
                            <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="input-field" required />
                        </div>
                        <input name="address" placeholder="Street Address" value={form.address} onChange={handleChange} className="input-field" required />
                        <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="input-field" required />

                        <h3 style={{ marginTop: '1.5rem' }}>💳 Payment Method</h3>
                        <div className="payment-options">
                            {['COD', 'Card', 'EasyPaisa', 'JazzCash'].map(m => (
                                <label key={m} className={`payment-option ${form.paymentMethod === m ? 'payment-active' : ''}`}>
                                    <input type="radio" name="paymentMethod" value={m} checked={form.paymentMethod === m} onChange={handleChange} />
                                    {m === 'COD' ? '💵 Cash on Delivery' : m === 'Card' ? '💳 Credit/Debit Card' : m === 'EasyPaisa' ? '📱 EasyPaisa' : '📱 JazzCash'}
                                </label>
                            ))}
                        </div>
                        {form.paymentMethod === 'Card' && (
                            <div className="card-fields">
                                <input className="input-field" placeholder="Card Number" />
                                <div className="form-row">
                                    <input className="input-field" placeholder="MM/YY" />
                                    <input className="input-field" placeholder="CVV" />
                                </div>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn-orange"
                            style={{ width: '100%', marginTop: '1.5rem' }}
                            disabled={loading || promoLoading}
                        >
                            {loading ? 'Placing Order...' : `Place Order — Rs. ${grandTotal}`}
                        </button>
                    </form>

                    {/* Summary */}
                    <div className="cart-summary">
                        <h3>Order Summary</h3>
                        {enrichedCart.map(i => (
                            <div key={i._id} className="summary-item">
                                <span>
                                    {i.name} × {i.quantity}
                                    {i.hasPizzaPromo && (
                                        <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 50, marginLeft: 5 }}>
                                            PIZZA 25% OFF
                                        </span>
                                    )}
                                </span>
                                <span>
                                    {i.finalPrice < i.price && (
                                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.8rem', marginRight: 4 }}>
                                            Rs. {i.price * i.quantity}
                                        </span>
                                    )}
                                    Rs. {i.finalPrice * i.quantity}
                                </span>
                            </div>
                        ))}
                        <hr style={{ margin: '0.75rem 0', borderColor: '#f0f0f0' }} />
                        <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
                        <div className="summary-row">
                            <span>Delivery</span>
                            <span>
                                {isFirstOrder ? (
                                    <>
                                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: 4, fontSize: '0.85rem' }}>Rs. {BASE_DELIVERY_FEE}</span>
                                        <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE 🎉</span>
                                    </>
                                ) : (
                                    `Rs. ${deliveryFee}`
                                )}
                            </span>
                        </div>
                        <div className="summary-row summary-total"><span>Total</span><span>Rs. {grandTotal}</span></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
