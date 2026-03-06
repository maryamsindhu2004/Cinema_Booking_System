// Booking state manager using localStorage

class BookingManager {
    constructor() {
        this.storageKey = 'cinemaBooking';
        this.steps = ['movie', 'timing', 'screen', 'seat', 'food', 'payment', 'confirmation'];
    }

    getBooking() {
        const booking = localStorage.getItem(this.storageKey);
        return booking ? JSON.parse(booking) : this.getDefaultBooking();
    }

    saveBooking(booking) {
        localStorage.setItem(this.storageKey, JSON.stringify(booking));
    }

    getDefaultBooking() {
        return {
            movieId: null,
            showId: null,
            screenTypeId: null,
            seatTypeId: null,
            food: [],
            paymentMethod: null,
            discountCode: null,
            discountAmount: 0,
            totalAmount: 0,
            refNumber: null
        };
    }

    updateBooking(updates) {
        const booking = this.getBooking();
        const updated = { ...booking, ...updates };
        this.saveBooking(updated);
        return updated;
    }

    reset() {
        localStorage.removeItem(this.storageKey);
    }

    getCurrentStep() {
        const booking = this.getBooking();
        if (!booking.movieId) return 1;
        if (!booking.showId) return 2;
        if (!booking.screenTypeId) return 3;
        if (!booking.seatTypeId) return 4;
        if (booking.food === undefined) return 5;
        if (!booking.paymentMethod) return 6;
        return 7;
    }
}

const bookingManager = new BookingManager();

function updateProgressBar(currentStep) {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) {
            step.classList.add('completed');
        } else if (index + 1 === currentStep) {
            step.classList.add('active');
        }
    });
}

function getMovieById(id) {
    return MOVIES.find(m => m.id === id);
}

function getShowById(id) {
    return SHOWS.find(s => s.id === id);
}

function getScreenTypeById(id) {
    return SCREEN_TYPES.find(s => s.id === id);
}

function getSeatTypeById(id) {
    return SEAT_TYPES.find(s => s.id === id);
}

function getPaymentMethodById(id) {
    return PAYMENT_METHODS.find(p => p.id === id);
}

function calculateTotal(booking) {
    let total = 0;
    
    if (booking.seatTypeId) {
        const seat = getSeatTypeById(booking.seatTypeId);
        if (seat) total += seat.price;
    }
    
    if (booking.screenTypeId) {
        const screen = getScreenTypeById(booking.screenTypeId);
        if (screen) total += screen.price;
    }
    
    if (booking.food && Array.isArray(booking.food)) {
        booking.food.forEach(item => {
            total += (item.price || 0) * (item.qty || 0);
        });
    }
    
    // Apply discount if valid code exists
    const discountAmount = calculateDiscount(total, booking.discountCode, booking.show?.date);
    const finalTotal = total - discountAmount;
    
    return Math.max(0, finalTotal); // Ensure total never goes negative
}

function generateRefNumber() {
    return 'BK' + Date.now().toString().slice(-8);
}

// Discount functions
function validateDiscountCode(code, bookingDate = null) {
    const upperCode = code.toUpperCase();
    const discount = DISCOUNT_CODES[upperCode];
    
    if (!discount) return null;
    
    // Check day restrictions if applicable
    if (discount.dayRestriction && bookingDate) {
        const date = new Date(bookingDate);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Tuesday is 2
        if (discount.dayRestriction === 'tuesday' && dayOfWeek !== 2) {
            return null; // Not Tuesday, discount not valid
        }
    }
    
    return discount;
}

function calculateDiscount(subtotal, discountCode, bookingDate = null) {
    if (!discountCode) return 0;
    
    const discount = validateDiscountCode(discountCode, bookingDate);
    if (!discount) return 0;
    
    if (discount.type === 'percentage') {
        return Math.round(subtotal * (discount.value / 100));
    } else if (discount.type === 'fixed') {
        return Math.min(discount.value, subtotal); // Don't exceed subtotal
    }
    
    return 0;
}
