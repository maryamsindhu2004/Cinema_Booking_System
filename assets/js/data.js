// Dynamic data loading from API for Cinema Booking System
const API_BASE = 'http://localhost:3000/api';

// Global data variables (will be populated from API)
let MOVIES = [];
let SHOWS = [];
let SCREEN_TYPES = [];
let SEAT_TYPES = [];
let FOOD_ITEMS = [];

// Load all data from API
async function loadDataFromAPI() {
    try {
        const [moviesRes, showsRes, screensRes, seatsRes, foodRes] = await Promise.all([
            fetch(`${API_BASE}/movies`),
            fetch(`${API_BASE}/shows`),
            fetch(`${API_BASE}/screen-types`),
            fetch(`${API_BASE}/seat-types`),
            fetch(`${API_BASE}/food-items`)
        ]);

        MOVIES = await moviesRes.json();
        SHOWS = await showsRes.json();
        SCREEN_TYPES = await screensRes.json();
        SEAT_TYPES = await seatsRes.json();
        FOOD_ITEMS = await foodRes.json();

        console.log('✅ Data loaded from database:', {
            movies: MOVIES.length,
            shows: SHOWS.length,
            screens: SCREEN_TYPES.length,
            seats: SEAT_TYPES.length,
            food: FOOD_ITEMS.length
        });

    } catch (error) {
        console.error('❌ Failed to load data from API:', error);
        // Fallback to static data if API fails
        console.log('🔄 Falling back to static data...');
        loadStaticData();
    }
}

// Fallback static data (in case API is down)
function loadStaticData() {
    MOVIES = [
        { id: 1, title: 'Mission Impossible: Dead Reckoning', duration: 163, genre: 'Action', rating: 'PG-13', language: 'English', icon: '🎬' },
        { id: 2, title: 'Oppenheimer', duration: 180, genre: 'Drama', rating: 'R', language: 'English', icon: '🎭' },
        { id: 3, title: 'Jawan', duration: 169, genre: 'Action', rating: 'UA', language: 'Hindi', icon: '🎬' },
        { id: 4, title: 'Pathaan', duration: 146, genre: 'Action', rating: 'UA', language: 'Hindi', icon: '🎬' },
        { id: 5, title: 'The Legend of Maula Jatt', duration: 153, genre: 'Action', rating: 'PG', language: 'Urdu', icon: '🎬' },
        { id: 6, title: 'Teefa in Trouble', duration: 155, genre: 'Comedy', rating: 'PG', language: 'Urdu', icon: '😅' },
        { id: 7, title: 'London Nahi Jaunga', duration: 140, genre: 'Romance', rating: 'PG', language: 'Urdu', icon: '💕' },
        { id: 8, title: 'Dune: Part Two', duration: 166, genre: 'Sci-Fi', rating: 'PG-13', language: 'English', icon: '🌌' },
        { id: 9, title: 'New Movie 2026', duration: 120, genre: 'Drama', rating: 'PG', language: 'English', icon: '🎭' }
    ];

    SHOWS = [
        { id: 1, movieId: 1, screenId: 1, time: '14:00', endTime: '16:45', cinema: 'Grand Cinema', date: '2026-03-01' },
        { id: 2, movieId: 2, screenId: 2, time: '18:00', endTime: '21:00', cinema: 'Grand Cinema', date: '2026-03-01' },
        { id: 3, movieId: 3, screenId: 3, time: '15:00', endTime: '17:50', cinema: 'Galaxy Cinemas', date: '2026-03-01' },
        { id: 4, movieId: 5, screenId: 1, time: '20:00', endTime: '22:30', cinema: 'Grand Cinema', date: '2026-03-02' },
        { id: 5, movieId: 1, screenId: 2, time: '12:00', endTime: '14:45', cinema: 'Galaxy Cinemas', date: '2026-03-02' },
        { id: 6, movieId: 3, screenId: 1, time: '16:00', endTime: '18:50', cinema: 'Grand Cinema', date: '2026-03-02' },
        { id: 7, movieId: 8, screenId: 2, time: '19:00', endTime: '21:46', cinema: 'Grand Cinema', date: '2026-03-03' },
        { id: 8, movieId: 1, screenId: 1, time: '18:00', endTime: '20:45', cinema: 'Grand Cinema', date: '2026-03-11' }
    ];

    SCREEN_TYPES = [
        { id: 1, name: 'Standard', description: 'Regular screen with comfortable seating', price: 1000, icon: '🖥️' },
        { id: 2, name: 'IMAX', description: 'Large screen with immersive experience', price: 1500, icon: '🍿' },
        { id: 3, name: '3D', description: '3D movie experience', price: 3000, icon: '🎥' }
    ];

    SEAT_TYPES = [
        { id: 1, category: 'Regular', price: 500 },
        { id: 2, category: 'Premium', price: 800 },
        { id: 3, category: 'VIP', price: 1200 }
    ];

    FOOD_ITEMS = [
        { id: 1, name: 'Popcorn', price: 400, icon: '🍿' },
        { id: 2, name: 'Coke', price: 200, icon: '🥤' },
        { id: 3, name: 'Pizza', price: 600, icon: '🍕' },
        { id: 4, name: 'Candy', price: 150, icon: '🍬' },
        { id: 5, name: 'Hot Dog', price: 400, icon: '🌭' },
        { id: 6, name: 'Ice Cream', price: 250, icon: '🍦' },
        { id: 7, name: 'Nachos', price: 350, icon: '🧀' },
        { id: 8, name: 'Juice', price: 180, icon: '🧃' }
    ];
}

// Initialize data loading
loadDataFromAPI();

// Static data (not stored in database)
const PAYMENT_METHODS = [
    { id: 1, name: 'Credit Card', icon: '💳' },
    { id: 2, name: 'JazzCash', icon: '📱' },
    { id: 3, name: 'EasyPaisa', icon: '💰' },
    { id: 4, name: 'Cash', icon: '💵' }
];

// Discount codes and rules
const DISCOUNT_CODES = {
    'STUDENT10': { type: 'percentage', value: 10, description: 'Student Discount - 10% off' },
    'FAMILY20': { type: 'percentage', value: 20, description: 'Family Discount - 20% off' },
    'FIRSTTIME': { type: 'fixed', value: 200, description: 'First Time Customer - Rs. 200 off' },
    'VIP50': { type: 'percentage', value: 50, description: 'VIP Member - 50% off' },
    // NEW DISCOUNT ADDED - Weekend special
    'WEEKEND15': { type: 'percentage', value: 15, description: 'Weekend Special - 15% off' },
    // NEW DISCOUNT ADDED - Tuesday special
    'TUESDAY40': { type: 'percentage', value: 40, description: 'Tuesday Special - 40% off (Tuesdays only)', dayRestriction: 'tuesday' }
};
