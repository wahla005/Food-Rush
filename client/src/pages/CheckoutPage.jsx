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
    const [minOrder, setMinOrder] = useState(0);
    const [restDeliveryFee, setRestDeliveryFee] = useState(BASE_DELIVERY_FEE);
    const [promoLoading, setPromoLoading] = useState(true);
    const [copiedAccount, setCopiedAccount] = useState(false);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [paymentProofUrl, setPaymentProofUrl] = useState(null); // uploaded screenshot URL
    const [paymentProofPreview, setPaymentProofPreview] = useState(null); // local preview

    // Merchant payment accounts (in production, these come from backend/env)
    const PAYMENT_ACCOUNTS = {
        EasyPaisa: { number: '0300-1234567', name: 'Food Rush Payments' },
        JazzCash: { number: '0321-7654321', name: 'Food Rush Payments' },
    };

    const [form, setForm] = useState({
        fullName: user?.name || '',
        phone: '',
        address: '',
        city: '',
        paymentMethod: 'COD',
        mobilePayNumber: '',   // user's own EasyPaisa/JazzCash number
        transactionRef: '',    // transaction ID/ref after payment
    });

    // ── Decide what items to checkout ──────────────────────────────────────────
    const itemsToProcess = directItem ? [directItem] : cart;
    const checkoutRestId = directItem ? directItem.restaurantId : cartRestId;
    const checkoutRestName = directItem ? directItem.restaurantName : cartRestName;

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

        // NEW: Fetch restaurant minOrder
        const fetchMinOrder = async () => {
            if (!checkoutRestId) return;
            try {
                const { data } = await API.get(`/restaurants/${checkoutRestId}`);
                setMinOrder(data.restaurant?.minOrder || 0);
                setRestDeliveryFee(data.restaurant?.deliveryFee ?? BASE_DELIVERY_FEE);
            } catch (err) {
                console.error('Failed to fetch minOrder', err);
            }
        };
        fetchMinOrder();
    }, [checkoutRestId]);

    // ── Compute per-item final prices (admin discount + Pizza promo stacked) ──
    const enrichedCart = itemsToProcess.map(item => {
        const finalPrice = getPromoPrice(item);
        const hasPizzaPromoActive = hasPizzaPromo(item);
        return { ...item, finalPrice, hasPizzaPromo: hasPizzaPromoActive };
    });

    const subtotal = enrichedCart.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
    const deliveryFee = isFirstOrder ? 0 : restDeliveryFee;
    const grandTotal = subtotal + deliveryFee;

    // ── Count active promos for display ──────────────────────────────────
    const pizzaPromoItems = enrichedCart.filter(i => i.hasPizzaPromo);

    // Pakistani phone format: 03XX-XXXXXXX (11 digits)
    const PK_PHONE_REGEX = /^03\d{2}-\d{7}$/;

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/[^\d-]/g, ''); // only digits and dash
        // Strip all dashes for raw digit computation
        const digits = val.replace(/-/g, '');
        // Limit to 11 digits
        const clipped = digits.slice(0, 11);
        // Auto-format: insert dash after 4th digit
        const formatted = clipped.length > 4
            ? clipped.slice(0, 4) + '-' + clipped.slice(4)
            : clipped;
        setForm(f => ({ ...f, phone: formatted }));
    };

    const handleOrder = async (e) => {
        e.preventDefault();
        if (!form.phone || !form.address || !form.city) { toast.error('Fill in all fields'); return; }
        if (!PK_PHONE_REGEX.test(form.phone)) {
            toast.error('Enter a valid Pakistani number (e.g. 0300-1234567)');
            return;
        }
        // Validate digital wallet fields
        if (['EasyPaisa', 'JazzCash'].includes(form.paymentMethod)) {
            if (!PK_PHONE_REGEX.test(form.mobilePayNumber)) {
                toast.error(`Enter your registered ${form.paymentMethod} number (e.g. 0300-1234567)`);
                return;
            }
            if (!form.transactionRef.trim()) {
                toast.error('Enter the Transaction ID / Reference number after paying');
                return;
            }
            if (!paymentProofUrl) {
                toast.error('Please upload a screenshot of your payment');
                return;
            }
        }
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
                // Digital wallet fields
                transactionRef: form.transactionRef || undefined,
                mobilePayNumber: form.mobilePayNumber || undefined,
                paymentProof: paymentProofUrl || undefined,
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

                {/* ── Minimum Order Warning ── */}
                {subtotal < minOrder && (
                    <div className="promo-banner promo-red" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', marginBottom: '1.5rem' }}>
                        ⚠️ <strong>Minimum Order Required:</strong> The minimum order amount for {checkoutRestName} is Rs. {minOrder}.
                        Current subtotal: <strong>Rs. {subtotal}</strong>.
                        Please add <strong>Rs. {minOrder - subtotal}</strong> more worth of items to proceed.
                    </div>
                )}

                <div className="checkout-layout">
                    {/* Form */}
                    <form onSubmit={handleOrder} className="checkout-form">
                        <h3>📍 Delivery Address</h3>
                        <div className="form-row">
                            <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className="input-field" required />
                            <input
                                name="phone"
                                placeholder="03XX-XXXXXXX"
                                value={form.phone}
                                onChange={handlePhoneChange}
                                className="input-field"
                                inputMode="numeric"
                                maxLength={12}
                                required
                            />
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

                        {/* ── EasyPaisa / JazzCash Instructions ── */}
                        {['EasyPaisa', 'JazzCash'].includes(form.paymentMethod) && (() => {
                            const acct = PAYMENT_ACCOUNTS[form.paymentMethod];
                            const isEP = form.paymentMethod === 'EasyPaisa';
                            const brand = isEP ? '#00a651' : '#e60026';
                            const brandLight = isEP ? 'rgba(0,166,81,0.12)' : 'rgba(230,0,38,0.1)';
                            const handleMobilePayPhone = (e) => {
                                const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 11);
                                const fmt = digits.length > 4 ? digits.slice(0, 4) + '-' + digits.slice(4) : digits;
                                setForm(f => ({ ...f, mobilePayNumber: fmt }));
                            };
                            return (
                                <div style={{
                                    background: brandLight,
                                    border: `1.5px solid ${brand}44`,
                                    borderRadius: 14,
                                    padding: '1.2rem 1.4rem',
                                    marginTop: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.9rem',
                                }}>
                                    {/* Step 1: Send money to merchant */}
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: brand, marginBottom: '0.4rem' }}>
                                            📲 Step 1 — Send Rs. {grandTotal} to our {form.paymentMethod} account:
                                        </p>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.7rem',
                                            background: 'white', borderRadius: 10,
                                            padding: '0.65rem 1rem',
                                            border: `1.5px solid ${brand}55`,
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111', margin: 0 }}>{acct.number}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>{acct.name}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(acct.number);
                                                    setCopiedAccount(true);
                                                    setTimeout(() => setCopiedAccount(false), 2000);
                                                    toast.success('Account number copied!');
                                                }}
                                                style={{
                                                    padding: '0.35rem 0.85rem', borderRadius: 8, border: 'none',
                                                    background: brand, color: 'white',
                                                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                                                }}
                                            >
                                                {copiedAccount ? '✓ Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Step 2: Enter registered number */}
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: brand, marginBottom: '0.4rem' }}>
                                            📞 Step 2 — Enter your registered {form.paymentMethod} number:
                                        </p>
                                        <input
                                            className="input-field"
                                            placeholder="03XX-XXXXXXX"
                                            value={form.mobilePayNumber}
                                            onChange={handleMobilePayPhone}
                                            inputMode="numeric"
                                            maxLength={12}
                                            required
                                            style={{ background: 'white', color: '#111', borderColor: brand + '55' }}
                                        />
                                    </div>

                                    {/* Step 3: Enter TXN reference */}
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: brand, marginBottom: '0.4rem' }}>
                                            🔖 Step 3 — Enter Transaction ID / Reference number:
                                        </p>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. EP1234567890 or JC9876543210"
                                            value={form.transactionRef}
                                            onChange={e => setForm(f => ({ ...f, transactionRef: e.target.value }))}
                                            required
                                            style={{ background: 'white', color: '#111', borderColor: brand + '55' }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.3rem' }}>
                                            ℹ️ You'll find the Transaction ID in your {form.paymentMethod} app under "Transaction History".
                                        </p>
                                    </div>

                                    {/* Step 4: Upload screenshot */}
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: brand, marginBottom: '0.4rem' }}>
                                            📸 Step 4 — Upload a screenshot of your payment:
                                        </p>
                                        <label style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            gap: '0.5rem', padding: '1rem',
                                            border: `2px dashed ${paymentProofUrl ? brand : '#d1d5db'}`,
                                            borderRadius: 12, cursor: 'pointer',
                                            background: paymentProofUrl ? (brandLight) : 'white',
                                            transition: 'all 0.2s',
                                        }}>
                                            {paymentProofPreview ? (
                                                <img src={paymentProofPreview} alt="Proof preview" style={{ maxHeight: 140, borderRadius: 8, objectFit: 'contain' }} />
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '2rem' }}>🖼️</span>
                                                    <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 500 }}>
                                                        {uploadingProof ? 'Uploading...' : 'Click to choose screenshot'}
                                                    </span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" style={{ display: 'none' }}
                                                onChange={async (ev) => {
                                                    const file = ev.target.files[0];
                                                    if (!file) return;
                                                    // Show local preview immediately
                                                    setPaymentProofPreview(URL.createObjectURL(file));
                                                    // Upload to server
                                                    setUploadingProof(true);
                                                    try {
                                                        const fd = new FormData();
                                                        fd.append('proof', file);
                                                        const { data } = await API.post('/orders/upload-proof', fd, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        setPaymentProofUrl(data.url);
                                                        toast.success('Screenshot uploaded!');
                                                    } catch {
                                                        toast.error('Upload failed. Try again.');
                                                        setPaymentProofPreview(null);
                                                    } finally {
                                                        setUploadingProof(false);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {paymentProofUrl && (
                                            <p style={{ fontSize: '0.75rem', color: brand, marginTop: '0.3rem', fontWeight: 600 }}>
                                                ✓ Screenshot uploaded. Admin will verify before confirming.
                                            </p>
                                        )}
                                    </div>

                                    {/* Warning notice */}
                                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '0.7rem 1rem' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#92400e', margin: 0, fontWeight: 600 }}>
                                            ⏳ Note: Your order status will be <strong>"Payment Pending"</strong> until the admin verifies your payment. You'll be notified once confirmed.
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}
                        <button
                            type="submit"
                            className="btn-orange"
                            style={{ width: '100%', marginTop: '1.5rem', opacity: (subtotal < minOrder) ? 0.6 : 1, cursor: (subtotal < minOrder) ? 'not-allowed' : 'pointer' }}
                            disabled={loading || promoLoading || (subtotal < minOrder)}
                        >
                            {loading ? 'Placing Order...' : (subtotal < minOrder) ? `Minimum Rs. ${minOrder} Required` : `Place Order — Rs. ${grandTotal}`}
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
