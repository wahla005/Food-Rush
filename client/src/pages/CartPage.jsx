import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import { getPromoPrice, hasPizzaPromo } from '../utils/promo';

const BASE_DELIVERY_FEE = 59;

const CartPage = () => {
    const { cart, removeFromCart, updateQty, total, clearCart, restaurantName, itemCount } = useCart();
    const navigate = useNavigate();
    const [isFirstOrder, setIsFirstOrder] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkFirstOrder = async () => {
            try {
                const { data } = await API.get('/orders/my');
                setIsFirstOrder(data.length === 0);
            } catch {
                setIsFirstOrder(false);
            } finally {
                setLoading(false);
            }
        };
        checkFirstOrder();
    }, []);

    // ── Compute final prices with Pizza promo ──────────────────────────
    const enrichedCart = cart.map(item => {
        const finalPrice = getPromoPrice(item);
        const hasPizzaPromoActive = hasPizzaPromo(item);
        return { ...item, finalPrice, hasPizzaPromo: hasPizzaPromoActive };
    });

    const subtotal = enrichedCart.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
    const deliveryFee = isFirstOrder ? 0 : BASE_DELIVERY_FEE;

    if (cart.length === 0) return (
        <div className="app-page">
            <Navbar />
            <div className="empty-cart">
                <FiShoppingBag size={64} />
                <h2>Your cart is empty</h2>
                <p>Add some delicious food to get started</p>
                <Link to="/menu" className="btn-orange">Browse Menu</Link>
            </div>
        </div>
    );

    return (
        <div className="app-page">
            <Navbar />
            <main className="page-content">
                <h1 className="page-title">Your Cart</h1>
                {restaurantName && <p className="cart-restaurant">📍 Ordering from <strong>{restaurantName}</strong></p>}

                <div className="cart-layout">
                    {/* Items */}
                    <div className="cart-items">
                        {enrichedCart.map(item => {
                            const discounted = item.finalPrice < item.price;
                            return (
                                <div key={item._id} className="cart-item">
                                    <img src={item.image} alt={item.name} className="cart-item-img" />
                                    <div className="cart-item-info">
                                        <h4>
                                            {item.name}
                                            {item.hasPizzaPromo && (
                                                <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: 50, marginLeft: 8 }}>
                                                    🍕 Pizza SPECIAL
                                                </span>
                                            )}
                                        </h4>
                                        {discounted ? (
                                            <p className="cart-item-price">
                                                <span style={{ textDecoration: 'line-through', color: '#9ca3af', marginRight: 4 }}>Rs. {item.price}</span>
                                                <span style={{ color: '#10b981', fontWeight: 700 }}>Rs. {item.finalPrice}</span>
                                            </p>
                                        ) : (
                                            <p className="cart-item-price">Rs. {item.price} each</p>
                                        )}
                                    </div>
                                    <div className="cart-item-actions">
                                        <div className="qty-selector">
                                            <button onClick={() => updateQty(item._id, item.quantity - 1)}><FiMinus /></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQty(item._id, item.quantity + 1)}><FiPlus /></button>
                                        </div>
                                        <span className="cart-item-total">Rs. {item.finalPrice * item.quantity}</span>
                                        <button className="remove-btn" onClick={() => removeFromCart(item._id)}><FiTrash2 /></button>
                                    </div>
                                </div>
                            );
                        })}
                        <button className="clear-cart-btn" onClick={clearCart}>🗑️ Clear Cart</button>
                    </div>

                    {/* Summary */}
                    <div className="cart-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
                        <div className="summary-row">
                            <span>Delivery Fee</span>
                            <span>
                                {loading ? '...' : isFirstOrder ? (
                                    <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE 🎉</span>
                                ) : `Rs. ${BASE_DELIVERY_FEE}`}
                            </span>
                        </div>
                        <div className="summary-row summary-total"><span>Total</span><span>Rs. {subtotal + deliveryFee}</span></div>
                        <button className="btn-orange" style={{ width: '100%', marginTop: '1rem' }}
                            onClick={() => navigate('/checkout')}>
                            Proceed to Checkout →
                        </button>
                        <Link to="/menu" className="continue-shopping">← Continue Shopping</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CartPage;
