require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const FoodItem = require('./models/FoodItem');

// Verified Unsplash food photo IDs — matched to actual food
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=500&h=350&fit=crop&q=80`;
const IMG_RESTO = (id) => `https://images.unsplash.com/photo-${id}?w=700&h=450&fit=crop&q=80`;

const restaurants = [
    {
        name: "McDonald's",
        image: IMG_RESTO('1568901346375-23c9450c58cd'),   // Big Mac close-up
        cuisine: ['Fast Food', 'Burgers'],
        rating: 4.3, deliveryTime: '25-35 min', minOrder: 300, deliveryFee: 49, isOpen: true,
        address: 'Main Boulevard, Lahore',
        description: "World's most famous fast food chain.",
    },
    {
        name: 'KFC',
        image: IMG_RESTO('1626645738196-c2a7c87a8f58'),   // Fried chicken bucket
        cuisine: ['Fast Food', 'Fried Chicken'],
        rating: 4.5, deliveryTime: '30-40 min', minOrder: 350, deliveryFee: 59, isOpen: true,
        address: 'Gulberg III, Lahore',
        description: "Finger lickin' good fried chicken.",
    },
    {
        name: 'Pizza Hut',
        image: IMG_RESTO('1565299624946-b28f40a0ae38'),   // Pepperoni pizza
        cuisine: ['Pizza', 'Italian'],
        rating: 4.2, deliveryTime: '35-50 min', minOrder: 500, deliveryFee: 79, isOpen: true,
        address: 'DHA Phase 5, Lahore',
        description: 'Premium pizzas freshly baked to perfection.',
    },
    {
        name: 'Desi Darbar',
        image: IMG_RESTO('1585937421612-70a008356fbe'),   // Chicken karahi / desi food
        cuisine: ['Desi', 'BBQ', 'Pakistani'],
        rating: 4.6, deliveryTime: '40-55 min', minOrder: 400, deliveryFee: 69, isOpen: true,
        address: 'Model Town, Lahore',
        description: 'Authentic Pakistani cuisine and BBQ.',
    },
    {
        name: 'Dragon Palace',
        image: IMG_RESTO('1534482421-64566f976cfa'),      // Noodles / Chinese
        cuisine: ['Chinese', 'Asian'],
        rating: 4.1, deliveryTime: '35-45 min', minOrder: 450, deliveryFee: 59, isOpen: true,
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
                image: IMG('1568901346375-23c9450c58cd'),    // Big Mac burger
                price: 750, category: 'Burgers', isVeg: false, rating: 4.5,
                ingredients: ['Beef Patty', 'Cheese', 'Lettuce', 'Tomato', 'Special Sauce', 'Sesame Bun'],
            },
            {
                name: 'McChicken',
                description: 'Crispy chicken burger with mayo',
                image: IMG('1551782450-a2132b4ba21d'),        // Chicken sandwich/burger
                price: 650, category: 'Burgers', isVeg: false, rating: 4.3,
                ingredients: ['Crispy Chicken', 'Mayo', 'Lettuce', 'Soft Bun'],
            },
            {
                name: 'Large Fries',
                description: 'Golden crispy French fries',
                image: IMG('1573080496219-bb080dd4f877'),     // French fries
                price: 299, category: 'Sides', isVeg: true, rating: 4.4,
                ingredients: ['Potatoes', 'Salt', 'Vegetable Oil'],
            },
            {
                name: 'McFlurry Oreo',
                description: 'Creamy soft serve ice cream with Oreo crumbles',
                image: IMG('1497034825429-c343d7c6a68f'),     // Ice cream dessert
                price: 350, category: 'Desserts', isVeg: true, rating: 4.6,
                ingredients: ['Ice Cream', 'Oreo Cookies', 'Milk'],
            },
        ],
        'KFC': [
            {
                name: 'Zinger Burger',
                description: 'Crispy spicy chicken fillet burger',
                image: IMG('1606755962773-d324e0a13086'),     // Fried chicken burger
                price: 699, category: 'Burgers', isVeg: false, rating: 4.6,
                ingredients: ['Spicy Chicken Fillet', 'Coleslaw', 'Mayo', 'Bun'],
            },
            {
                name: '4-pc Chicken',
                description: 'Signature KFC crispy fried chicken pieces',
                image: IMG('1626645738196-c2a7c87a8f58'),     // KFC fried chicken
                price: 899, category: 'Fried Chicken', isVeg: false, rating: 4.7,
                ingredients: ['Chicken', '11 Secret Herbs & Spices', 'Flour'],
            },
            {
                name: 'Hot Wings',
                description: 'Spicy buffalo chicken wings (6 pcs)',
                image: IMG('1527477396000-e27163b481c2'),     // Chicken wings
                price: 579, category: 'Sides', isVeg: false, rating: 4.4,
                ingredients: ['Chicken Wings', 'Hot Sauce', 'Spices'],
            },
            {
                name: 'Pepsi Large',
                description: 'Chilled Pepsi served in a large cup with ice',
                image: IMG('1554866585-cd94860890b7'),        // Soft drink
                price: 149, category: 'Drinks', isVeg: true, rating: 4.0,
                ingredients: ['Pepsi', 'Ice'],
            },
        ],
        'Pizza Hut': [
            {
                name: 'Pepperoni Pizza',
                description: 'Classic pepperoni with melted mozzarella cheese',
                image: IMG('1565299624946-b28f40a0ae38'),     // Pepperoni pizza
                price: 1299, category: 'Pizza', isVeg: false, rating: 4.5,
                ingredients: ['Pizza Dough', 'Tomato Sauce', 'Mozzarella', 'Pepperoni'],
            },
            {
                name: 'BBQ Chicken Pizza',
                description: 'Smoky BBQ sauce with grilled chicken and cheese',
                image: IMG('1513104890138-7c749659a591'),     // BBQ chicken pizza
                price: 1399, category: 'Pizza', isVeg: false, rating: 4.4,
                ingredients: ['Pizza Dough', 'BBQ Sauce', 'Grilled Chicken', 'Cheese'],
            },
            {
                name: 'Veggie Supreme',
                description: 'Loaded with fresh garden vegetables on tomato base',
                image: IMG('1574071318508-1cdbab80d002'),     // Veggie pizza
                price: 1199, category: 'Pizza', isVeg: true, rating: 4.2,
                ingredients: ['Pizza Dough', 'Tomato Sauce', 'Bell Peppers', 'Mushrooms', 'Olives'],
            },
            {
                name: 'Garlic Bread',
                description: 'Crispy toasted bread with garlic butter and herbs',
                image: IMG('1619535860434-ba1d8fa12536'),     // Garlic bread
                price: 349, category: 'Sides', isVeg: true, rating: 4.3,
                ingredients: ['Bread', 'Garlic Butter', 'Herbs'],
            },
        ],
        'Desi Darbar': [
            {
                name: 'Chicken Karahi',
                description: 'Spicy wok-cooked chicken with tomatoes and green chili',
                image: IMG('1585937421612-70a008356fbe'),     // Chicken karahi / curry
                price: 999, category: 'Desi', isVeg: false, rating: 4.8,
                ingredients: ['Chicken', 'Tomatoes', 'Green Chili', 'Ginger', 'Spices'],
            },
            {
                name: 'Seekh Kabab',
                description: 'Minced beef BBQ kababs on skewers (4 pcs)',
                image: IMG('1599487488170-d11ec9c172f0'),     // Seekh / skewer kabab
                price: 799, category: 'BBQ', isVeg: false, rating: 4.7,
                ingredients: ['Minced Beef', 'Onions', 'Spices', 'Fresh Herbs'],
            },
            {
                name: 'Biryani (Full)',
                description: 'Aromatic basmati rice layered with tender chicken',
                image: IMG('1563379091339-03246963d12e'),     // Biryani / rice dish
                price: 850, category: 'Desi', isVeg: false, rating: 4.6,
                ingredients: ['Basmati Rice', 'Chicken', 'Saffron', 'Whole Spices'],
            },
            {
                name: 'Naan',
                description: 'Fluffy tandoor-baked naan bread with butter',
                image: IMG('1601050690597-df0568f70950'),     // Naan bread
                price: 60, category: 'Bread', isVeg: true, rating: 4.5,
                ingredients: ['Flour', 'Yeast', 'Salt', 'Butter'],
            },
        ],
        'Dragon Palace': [
            {
                name: 'Chow Mein',
                description: 'Stir-fried noodles with chicken and fresh vegetables',
                image: IMG('1534482421-64566f976cfa'),        // Noodles stir-fry
                price: 599, category: 'Chinese', isVeg: false, rating: 4.3,
                ingredients: ['Noodles', 'Chicken', 'Spring Onion', 'Soy Sauce', 'Vegetables'],
            },
            {
                name: 'Fried Rice',
                description: 'Classic Chinese egg fried rice with spring onions',
                image: IMG('1512058564366-18510be2db19'),     // Fried rice
                price: 499, category: 'Chinese', isVeg: false, rating: 4.2,
                ingredients: ['Rice', 'Eggs', 'Spring Onion', 'Soy Sauce'],
            },
            {
                name: 'Chicken Manchurian',
                description: 'Crispy chicken balls in tangy Manchurian sauce',
                image: IMG('1569050467447-ce54b3bbc37d'),     // Chinese chicken dish
                price: 699, category: 'Chinese', isVeg: false, rating: 4.4,
                ingredients: ['Chicken', 'Manchurian Sauce', 'Garlic', 'Ginger', 'Chili'],
            },
            {
                name: 'Spring Rolls',
                description: 'Crispy golden vegetable spring rolls (6 pcs)',
                image: IMG('1607330289024-1535c6b4e1c1'),     // Spring rolls
                price: 349, category: 'Starters', isVeg: true, rating: 4.1,
                ingredients: ['Cabbage', 'Carrots', 'Spring Onion', 'Rice Paper'],
            },
        ],
    };
    return (menus[name] || []).map(item => ({ ...item, restaurant: restaurantId }));
};

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
        await Restaurant.deleteMany();
        await FoodItem.deleteMany();
        console.log('🗑️  Cleared existing data');
        for (const rData of restaurants) {
            const restaurant = await Restaurant.create(rData);
            const foods = getFoodItems(restaurant._id, restaurant.name);
            await FoodItem.insertMany(foods);
            console.log(`✅ Seeded: ${restaurant.name} (${foods.length} items)`);
        }
        console.log('\n🎉 Seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
};

seed();
