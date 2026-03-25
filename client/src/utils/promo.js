/**
 * Apply the regular discounted price (admin discount).
 * The Today's Special pizza promo has been removed.
 */
export const getPromoPrice = (item) => {
    if (!item) return 0;

    // Apply regular discounted price (admin discount)
    const disc = item.discount || 0;
    return disc > 0 ? Math.round(item.price * (1 - disc / 100)) : item.price;
};
