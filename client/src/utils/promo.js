/**
 * Apply the Today's Special promo (25% off for Pizza items over Rs. 1500).
 * Stacks on top of existing admin discounts.
 */
export const getPromoPrice = (item) => {
    if (!item) return 0;

    // 1. Start with regular discounted price (admin discount)
    const disc = item.discount || 0;
    let price = disc > 0 ? Math.round(item.price * (1 - disc / 100)) : item.price;

    // 2. Apply Rule: Over Rs. 1500 Pizza items get extra 25% off
    const isPizzaPromo = item.category?.toLowerCase() === 'pizza' && item.price > 1500;
    if (isPizzaPromo) {
        price = Math.round(price * 0.75);
    }

    return price;
};

export const hasPizzaPromo = (item) => {
    return item?.category?.toLowerCase() === 'pizza' && item?.price > 1500;
};
