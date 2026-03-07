import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import { getPromoPrice } from '../utils/promo';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try { return JSON.parse(localStorage.getItem('cart')) || []; }
        catch { return []; }
    });
    const [restaurantId, setRestaurantId] = useState(() => localStorage.getItem('cartRestaurant') || null);
    const [restaurantName, setRestaurantName] = useState(() => localStorage.getItem('cartRestaurantName') || '');

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
        localStorage.setItem('cartRestaurant', restaurantId || '');
        localStorage.setItem('cartRestaurantName', restaurantName || '');
    }, [cart, restaurantId, restaurantName]);

    const addToCart = (item, restId, restName) => {
        if (cart.length > 0 && restaurantId && restaurantId !== restId) {
            toast.error('Clear cart to order from a different restaurant');
            return;
        }
        setRestaurantId(restId);
        setRestaurantName(restName);

        // Compute effective price after admin discount
        const disc = item.discount || 0;
        const effectivePrice = disc > 0 ? Math.round(item.price * (1 - disc / 100)) : item.price;

        // Show toast BEFORE setCart — StrictMode double-invokes updater functions
        const alreadyInCart = cart.find(i => i._id === item._id);
        if (alreadyInCart) {
            toast.success('Quantity updated');
        } else {
            toast.success(`${item.name} added to cart`);
        }

        setCart(prev => {
            const exists = prev.find(i => i._id === item._id);
            if (exists) {
                return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, effectivePrice, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => {
            const updated = prev.filter(i => i._id !== id);
            if (updated.length === 0) { setRestaurantId(null); setRestaurantName(''); }
            return updated;
        });
    };

    const updateQty = (id, qty) => {
        if (qty < 1) { removeFromCart(id); return; }
        setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
    };

    const clearCart = () => {
        setCart([]); setRestaurantId(null); setRestaurantName('');
        localStorage.removeItem('cart');
    };

    // Use full promo-aware price for total
    const total = cart.reduce((sum, i) => sum + getPromoPrice(i) * i.quantity, 0);
    const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, itemCount, restaurantId, restaurantName }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
