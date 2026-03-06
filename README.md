# Cinema Booking System - Multi-Page Flow

## Overview
A **complete 7-step cinema booking flow** with separate HTML pages for each step. Each page is independent but shares data using **localStorage**, creating a seamless booking experience.

## Directory Structure

```
cinema-booking-flow/
├── index.html                    # Welcome/entry point
├── step1-movie.html             # Select movie
├── step2-timing.html            # Select show timing
├── step3-screen.html            # Select screen type
├── step4-seat.html              # Select seat type
├── step5-food.html              # Order food items
├── step6-payment.html           # Select payment method
├── step7-confirmation.html      # Booking confirmation
└── assets/
    ├── css/
    │   └── style.css            # Shared styling
    └── js/
        ├── data.js              # Database data
        └── booking.js           # State management + utilities
```

## How It Works

### Data Persistence
- Each page uses **localStorage** to save and load booking data
- The `BookingManager` class handles all state management
- Data flows: Step 1 → Step 2 → ... → Step 7
- Each step validates that previous steps are complete before loading

### File Descriptions

#### `index.html`
- Entry point of the application
- Shows welcome message and booking flow overview
- Links to step1-movie.html

#### `step1-movie.html` - 🎬 Select Movie
- Displays all 7 available movies
- User selects one movie
- Saves `movieId` to localStorage
- Navigates to step2-timing.html

#### `step2-timing.html` - 🎟️ Select Timing
- Filters shows based on selected `movieId`
- User selects one show time
- Saves `showId` to localStorage
- Can go back to step1-movie.html
- Navigates to step3-screen.html

#### `step3-screen.html` - 🖥️ Select Screen Type
- Displays 3 screen types (Standard, IMAX, 3D)
- Shows price for each option
- User selects one screen type
- Shows running total (screen price)
- Saves `screenTypeId` to localStorage
- Navigates to step4-seat.html

#### `step4-seat.html` - 🪑 Select Seat Type
- Displays 3 seat categories (Regular, Premium, VIP)
- Shows running total (seat price + screen price)
- User selects one seat type
- Saves `seatTypeId` to localStorage
- Initializes `food` array in localStorage
- Navigates to step5-food.html

#### `step5-food.html` - 🍿 Order Food
- Displays 8 food/beverage items
- User can add quantities (+/- buttons)
- **Optional step** - user can skip without selecting anything
- Shows food summary when items are selected
- Saves `food` array to localStorage
- Navigates to step6-payment.html

#### `step6-payment.html` - 💳 Select Payment
- Displays 4 payment methods (Credit Card, JazzCash, EasyPaisa, Cash)
- Shows **complete order summary**:
  - Movie name
  - Show time and cinema
  - Screen type and price
  - Seat type and price
  - Food items (if any) with prices
  - **Total Amount**
  - Payment method
- User selects payment method
- Saves `paymentMethod` to localStorage
- Calculates and saves `totalAmount`
- Generates `refNumber` (BK + timestamp)
- Navigates to step7-confirmation.html

#### `step7-confirmation.html` - ✓ Confirmation
- Shows success message
- Displays booking reference number
- Shows complete booking details
- User can click "Book Another Ticket" to reset and start over

### Core Assets

#### `assets/css/style.css`
- Shared styling for all pages
- Grid layouts for cards
- Button styles (primary, secondary, success)
- Progress bar styling
- Responsive design (mobile, tablet, desktop)

#### `assets/js/data.js`
- **MOVIES** (7 movies) - id, title, duration, genre, rating, language, icon
- **SHOWS** (6 show times) - movieId, time, cinema, date, etc.
- **SCREEN_TYPES** (3 types) - Standard, IMAX, 3D with prices
- **SEAT_TYPES** (3 categories) - Regular, Premium, VIP with prices
- **FOOD_ITEMS** (8 items) - Popcorn, Coke, Pizza, etc. with prices
- **PAYMENT_METHODS** (4 methods) - Credit Card, JazzCash, EasyPaisa, Cash

#### `assets/js/booking.js`
- **BookingManager** class:
  - `getBooking()` - Get current booking from localStorage
  - `saveBooking(booking)` - Save booking to localStorage
  - `updateBooking(updates)` - Update specific fields
  - `reset()` - Clear all booking data
  - Helper functions for finding data by ID
  - `calculateTotal(booking)` - Compute final price
  - `generateRefNumber()` - Create booking reference

## Booking Flow (7 Steps)

```
START
  ↓
[1] Select Movie
  ↓
[2] Select Show Timing (filtered by movie)
  ↓
[3] Select Screen Type (Standard/IMAX/3D)
  ↓
[4] Select Seat Type (Regular/Premium/VIP)
  ↓
[5] Order Food (optional snacks)
  ↓
[6] Select Payment & Review Summary
  ↓
[7] Confirmation with Booking Reference
  ↓
[Book Another] (reset and go to Step 1)
```

## Pricing Formula

```
Total = Seat Price + Screen Price + Σ(Food Price × Quantity)
```

### Example Calculations
- **Scenario 1**: Regular seat (500) + Standard screen (1000) + Popcorn (300) + Coke (200)
  - Total = **2,000 Rs.**

- **Scenario 2**: VIP seat (1000) + 3D screen (3000) + Pizza (600) + Hot Dog (400)
  - Total = **5,000 Rs.**

## Features

✅ **Multi-Page Flow** - Each step is a separate HTML file  
✅ **localStorage Persistence** - Data survives page navigation  
✅ **Progress Bar** - Visual indicator of booking progress  
✅ **Input Validation** - Pages prevent skipping steps  
✅ **Back Navigation** - Users can revisit previous steps  
✅ **Real-time Calculations** - Running total updates shown  
✅ **Optional Food Order** - Complete booking without food  
✅ **Booking Reference** - Unique ID generated at checkout  
✅ **Responsive Design** - Works on mobile, tablet, desktop  
✅ **Pakistani Context** - Local payment methods, Urdu movies, Rupees  

## Setup & Usage

1. **Start Here**: Open `index.html` in a web browser
   - Click "Start Booking" button

2. **Step 1**: Select a movie
   - Choose from 7 movies
   - Click "Next →" to proceed

3. **Step 2**: Select show timing
   - Times shown are filtered by selected movie
   - Click "Next →" to proceed

4. **Step 3**: Select screen type
   - View running total (screen price added)
   - Click "Next →" to proceed

5. **Step 4**: Select seat type
   - View running total (seat + screen)
   - Click "Next →" to proceed

6. **Step 5**: Order food (optional)
   - Use +/- buttons to add items
   - Can skip this step
   - Click "Next →" to proceed

7. **Step 6**: Select payment
   - Review complete order summary
   - Click payment method card
   - Click "Checkout" button

8. **Step 7**: Confirmation
   - View booking reference number
   - See all details
   - Click "Book Another Ticket" to start over

## Technology Stack

- **HTML5** - Page structure
- **CSS3** - Responsive styling
- **JavaScript (Vanilla)** - No frameworks
- **localStorage** - Data persistence

## localStorage Schema

```javascript
{
  movieId: 1,
  showId: 2,
  screenTypeId: 3,
  seatTypeId: 1,
  food: [
    { id: 1, name: "Popcorn", price: 300, icon: "🍿", qty: 2 }
  ],
  paymentMethod: 4,
  totalAmount: 2500,
  refNumber: "BK72345678"
}
```

## Database Table Mapping

| Database Table | Data Location | Step |
|---|---|---|
| Movie | data.js - MOVIES | 1 |
| ShowTable | data.js - SHOWS | 2 |
| ScreenType | data.js - SCREEN_TYPES | 3 |
| SeatType | data.js - SEAT_TYPES | 4 |
| FoodItem | data.js - FOOD_ITEMS | 5 |
| FoodOrder | localStorage - food array | 5 |
| Payment | data.js - PAYMENT_METHODS | 6 |
| Booking | localStorage - complete object | 7 |

## Browser Compatibility

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅
- Mobile browsers ✅

## Notes

- Each page uses the same CSS file for consistent styling
- Data is stored in localStorage (no server needed for demo)
- Progress bar fills automatically based on completed steps
- Users can go back to previous steps using "← Back" button
- "Reset" button clears all booking data (only on Step 1)
- All prices are in Pakistani Rupees (Rs.)

## Future Enhancements

- Add backend API integration
- Implement actual payment gateway
- Add email ticket delivery
- Add user login/signup
- Store booking history
- Add seat chart visualization
- Implement discount codes
- Add booking cancellation
