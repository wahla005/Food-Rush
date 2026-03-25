require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');
const Category = require('./models/Category');

// Verified Unsplash food photo IDs — matched to actual food
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=500&h=350&fit=crop&q=80`;
const IMG_RESTO = (id) => `https://images.unsplash.com/photo-${id}?w=700&h=450&fit=crop&q=80`;

const restaurants = [
    {
        name: "McDonald's",
        image: IMG_RESTO('1561758033-d89a9ad462b4'),
        cuisine: ['Fast Food', 'Burgers'],
        deliveryTime: '25-35 min', minOrder: 300, deliveryFee: 49, isOpen: true,
        address: 'Main Boulevard, Lahore',
        description: "World's most famous fast food chain.",
    },
    {
        name: 'KFC',
        image: IMG_RESTO('1616534497247-adb51cbd3fda'),
        cuisine: ['Fast Food', 'Fried Chicken'],
        deliveryTime: '30-40 min', minOrder: 350, deliveryFee: 59, isOpen: true,
        address: 'Gulberg III, Lahore',
        description: "Finger lickin' good fried chicken.",
    },
    {
        name: 'Pizza Hut',
        image: IMG_RESTO('1541745537411-b8046dc6d66c'),
        cuisine: ['Pizza', 'Italian'],
        deliveryTime: '35-50 min', minOrder: 500, deliveryFee: 79, isOpen: true,
        address: 'DHA Phase 5, Lahore',
        description: 'Premium pizzas freshly baked to perfection.',
    },
    {
        name: 'Desi Darbar',
        image: IMG_RESTO('1585937421612-70a008356fbe'),
        cuisine: ['Desi', 'BBQ', 'Pakistani'],
        deliveryTime: '40-55 min', minOrder: 400, deliveryFee: 69, isOpen: true,
        address: 'Model Town, Lahore',
        description: 'Authentic Pakistani cuisine and BBQ.',
    },
    {
        name: 'Dragon Palace',
        image: IMG_RESTO('1534482421-64566f976cfa'),
        cuisine: ['Chinese', 'Asian'],
        deliveryTime: '35-45 min', minOrder: 450, deliveryFee: 59, isOpen: true,
        address: 'Johar Town, Lahore',
        description: 'Authentic Chinese cuisine with bold flavors.',
    },
];

const getFoodItems = (restaurantId, name) => {
    const menus = {
        "McDonald's": [
            {
                name: 'Big Mac',
                description: 'Classic double patty burger with special sauce',
                image: IMG('1568901346375-23c9450c58cd'),
                price: 750, category: 'Burgers', isVeg: false,
                ingredients: ['Beef Patty', 'Cheese', 'Lettuce', 'Tomato', 'Special Sauce', 'Sesame Bun'],
            },
            {
                name: 'McChicken',
                description: 'Crispy chicken burger with mayo',
                image: IMG('1551782450-a2132b4ba21d'),
                price: 650, category: 'Burgers', isVeg: false,
                ingredients: ['Crispy Chicken', 'Mayo', 'Lettuce', 'Soft Bun'],
            },
            {
                name: 'Large Fries',
                description: 'Golden crispy French fries',
                image: IMG('1573080496219-bb080dd4f877'),
                price: 299, category: 'Sides', isVeg: true,
                ingredients: ['Potatoes', 'Salt', 'Vegetable Oil'],
            },
            {
                name: 'McFlurry Oreo',
                description: 'Creamy soft serve ice cream with Oreo crumbles',
                image: IMG('1497034825429-c343d7c6a68f'),
                price: 350, category: 'Desserts', isVeg: true,
                ingredients: ['Ice Cream', 'Oreo Cookies', 'Milk'],
            },
            {
                name: 'Vanilla Soft Serve Cone',
                description: 'Classic creamy vanilla soft serve in a crisp cone',
                image: '/images/food/mcd-ice-cream.png',
                price: 150, category: 'Ice Cream', isVeg: true,
                ingredients: ['Milk', 'Sugar', 'Vanilla', 'Wafer Cone'],
            },
            {
                name: 'Medium Coca-Cola',
                description: 'Chilled and refreshing Coca-Cola classic',
                image: '/images/food/mcd-drinks.png',
                price: 180, category: 'Drinks', isVeg: true,
                ingredients: ['Carbonated Water', 'Sugar', 'Caffeine'],
            },
            {
                name: 'Hot Apple Pie',
                description: 'Crispy pastry with a warm, cinnamon apple filling',
                image: '/images/food/mcd-desserts.png',
                price: 250, category: 'Desserts', isVeg: true,
                ingredients: ['Apples', 'Cinnamon', 'Wheat Flour', 'Sugar'],
            },
        ],
        'KFC': [
            {
                name: 'Zinger Burger',
                description: 'Crispy spicy chicken fillet burger',
                image: IMG('1606755962773-d324e0a13086'),
                price: 699, category: 'Burgers', isVeg: false,
                ingredients: ['Spicy Chicken Fillet', 'Coleslaw', 'Mayo', 'Bun'],
            },
            {
                name: '4-pc Chicken',
                description: 'Signature KFC crispy fried chicken pieces',
                image: IMG('1626645738196-c2a7c87a8f58'),
                price: 899, category: 'Fried Chicken', isVeg: false,
                ingredients: ['Chicken', '11 Secret Herbs & Spices', 'Flour'],
            },
            {
                name: 'Hot Wings',
                description: 'Spicy buffalo chicken wings (6 pcs)',
                image: IMG('1527477396000-e27163b481c2'),
                price: 579, category: 'Sides', isVeg: false,
                ingredients: ['Chicken Wings', 'Hot Sauce', 'Spices'],
            },
            {
                name: 'Pepsi Large',
                description: 'Chilled Pepsi served in a large cup with ice',
                image: IMG('1554866585-cd94860890b7'),
                price: 149, category: 'Drinks', isVeg: true,
                ingredients: ['Pepsi', 'Ice'],
            },
            {
                name: 'Oreo Krusher',
                description: 'Thick and creamy milkshake with crushed Oreo pieces',
                image: '/images/food/kfc-ice-cream.png',
                price: 450, category: 'Ice Cream', isVeg: true,
                ingredients: ['Milk', 'Ice Cream', 'Oreo Cookies'],
            },
            {
                name: 'Mirinda Orange',
                description: 'Refreshing tangy orange flavored soda',
                image: '/images/food/kfc-drinks.png',
                price: 149, category: 'Drinks', isVeg: true,
                ingredients: ['Carbonated Water', 'Orange Flavor', 'Sugar'],
            },
            {
                name: 'Chocolate Lava Cake',
                description: 'Warm chocolate cake with a molten chocolate center',
                image: '/images/food/kfc-desserts.png',
                price: 320, category: 'Desserts', isVeg: true,
                ingredients: ['Dark Chocolate', 'Butter', 'Eggs', 'Sugar'],
            },
        ],
        'Pizza Hut': [
            {
                name: 'Pepperoni Pizza',
                description: 'Classic pepperoni with melted mozzarella cheese',
                image: IMG('1565299624946-b28f40a0ae38'),
                price: 1299, category: 'Pizza', isVeg: false,
                ingredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella', 'Pepperoni'],
            },
            {
                name: 'BBQ Chicken Pizza',
                description: 'Smoky BBQ sauce with grilled chicken and cheese',
                image: IMG('1513104890138-7c749659a591'),
                price: 1399, category: 'Pizza', isVeg: false,
                ingredients: ['Pizza Dough', 'BBQ Sauce', 'Grilled Chicken', 'Cheese'],
            },
            {
                name: 'Pasta Carbonara',
                description: 'Creamy pasta with egg, cheese, and crispy beef bacon',
                image: IMG('1546549032-9571cd6b27df'),
                price: 899, category: 'Pasta', isVeg: false,
                ingredients: ['Spaghetti', 'Eggs', 'Cheese', 'Beef Bacon'],
            },
            {
                name: 'Garden Salad',
                description: 'Fresh seasonal vegetables with lemon dressing',
                image: IMG('1512621776951-a57141f2eefd'),
                price: 450, category: 'Salad', isVeg: true,
                ingredients: ['Lettuce', 'Cucumber', 'Tomatoes', 'Lemon Dressing'],
            },
        ],
        'Desi Darbar': [
            {
                name: 'Chicken Karahi',
                description: 'Spicy wok-cooked chicken with tomatoes and green chili',
                image: IMG('1585937421612-70a008356fbe'),
                price: 999, category: 'Desi', isVeg: false,
                ingredients: ['Chicken', 'Tomatoes', 'Green Chili', 'Ginger', 'Spices'],
            },
            {
                name: 'Seekh Kabab',
                description: 'Minced beef BBQ kababs on skewers (4 pcs)',
                image: IMG('1599487488170-d11ec9c172f0'),
                price: 799, category: 'BBQ', isVeg: false,
                ingredients: ['Minced Beef', 'Onions', 'Spices', 'Fresh Herbs'],
            },
            {
                name: 'Grilled Salmon',
                description: 'Perfectly seared salmon fillet with lemon butter',
                image: IMG('1519708227418-c8fd9a32b7a2'),
                price: 1850, category: 'Seafood', isVeg: false,
                ingredients: ['Salmon', 'Lemon', 'Butter', 'Asparagus'],
            },
            {
                name: 'Biryani (Full)',
                description: 'Aromatic basmati rice layered with tender chicken',
                image: IMG('1589302168068-9646fd2e3b54'),
                price: 850, category: 'Desi', isVeg: false,
                ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Whole Spices'],
            },
            {
                name: 'Pancakes & Syrup',
                description: 'Fluffy buttermilk pancakes with maple syrup',
                image: IMG('1567620985472-f51b4b9ad99d'),
                price: 550, category: 'Breakfast', isVeg: true,
                ingredients: ['Flour', 'Milk', 'Eggs', 'Maple Syrup'],
            },
        ],
        'Dragon Palace': [
            {
                name: 'Chow Mein',
                description: 'Stir-fried noodles with chicken and fresh vegetables',
                image: IMG('1534482421-64566f976cfa'),
                price: 599, category: 'Chinese', isVeg: false,
                ingredients: ['Noodles', 'Chicken', 'Spring Onion', 'Soy Sauce', 'Vegetables'],
            },
            {
                name: 'Beef Steak',
                description: 'Juicy ribeye steak with mashed potatoes',
                image: IMG('1600891964599-f61ba0e24092'),
                price: 2450, category: 'Steaks', isVeg: false,
                ingredients: ['Ribeye Beef', 'Potatoes', 'Butter', 'Rosemary'],
            },
            {
                name: 'Cappuccino',
                description: 'Rich espresso with frothy steamed milk',
                image: IMG('1509042239860-f550ce710b93'),
                price: 399, category: 'Coffee', isVeg: true,
                ingredients: ['Espresso', 'Steamed Milk', 'Cocoa Powder'],
            },
            {
                name: 'Quinoa Bowl',
                description: 'Healthy quinoa with roasted vegetables and tahini',
                image: IMG('1512621776951-a57141f2eefd'),
                price: 750, category: 'Healthy', isVeg: true,
                ingredients: ['Quinoa', 'Sweet Potato', 'Kale', 'Tahini'],
            },
        ],
    };
    return (menus[name] || []).map(item => ({ ...item, restaurant: restaurantId }));
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        await Restaurant.deleteMany();
        await FoodItem.deleteMany();
        await Category.deleteMany();
        console.log('Cleared existing data');

        const cats = [
            { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop' },
            { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop' },
            { name: 'Desi', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=400&fit=crop' },
            { name: 'BBQ', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop' },
            { name: 'Chinese', image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop' },
            { name: 'Fried Chicken', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop' },
            { name: 'Seafood', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop' },
            { name: 'Steaks', image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=400&h=400&fit=crop' },
            { name: 'Pasta', image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&h=400&fit=crop' },
            { name: 'Salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop' },
            { name: 'Breakfast', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=400&fit=crop' },
            { name: 'Coffee', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop' },
            { name: 'Healthy', image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop' },
            { name: 'Desserts', image: 'https://images.unsplash.com/photo-1567620985472-f51b4b9ad99d?w=400&h=400&fit=crop' },
            { name: 'Ice Cream', image: 'https://images.unsplash.com/photo-1501443638710-338e920ed77a?w=400&h=400&fit=crop' },
            { name: 'Drinks', image: 'https://images.unsplash.com/photo-1544145945-f9042a8a73aa?w=400&h=400&fit=crop' },
            { name: 'Sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop' },
            { name: 'Bread', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop' },
            { name: 'Starters', image: 'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400&h=400&fit=crop' },
        ];
        await Category.insertMany(cats);
        console.log('Seeded categories');
        for (const rData of restaurants) {
            const restaurant = await Restaurant.create(rData);
            const foods = getFoodItems(restaurant._id, restaurant.name);
            await FoodItem.insertMany(foods);
            console.log(`Seeded: ${restaurant.name} (${foods.length} items)`);
        }
        console.log('\nSeeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
};

seed();
