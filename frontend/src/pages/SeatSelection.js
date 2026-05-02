import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SeatSelection() {
    const { showId } = useParams();
    const navigate = useNavigate();
    const [seats, setSeats] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
    const [showData, setShowData] = useState(null);
    const [bookingStatus, setBookingStatus] = useState(null);

    const user = JSON.parse(localStorage.getItem('theatro_user'));

    useEffect(() => {
        // Fetch Seats
        const fetchSeats = fetch(`/api/shows/${showId}/seats`).then(res => res.json());
        // Fetch Food Items
        const fetchItems = fetch('/api/items').then(res => res.json());
        // Fetch Show Details (for screen price)
        const fetchShow = fetch(`/api/shows/${showId}`).then(res => res.json());

        Promise.all([fetchSeats, fetchItems, fetchShow])
            .then(([seatData, itemData, showRes]) => {
                if (seatData.success) setSeats(seatData.data);
                if (itemData.success) setMenuItems(itemData.data);
                if (showRes.success) setShowData(showRes.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [showId]);

    const toggleSeat = (seatId) => {
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };

    const updateItemQty = (itemId, delta) => {
        const current = selectedItems[itemId] || 0;
        const next = Math.max(0, current + delta);
        setSelectedItems({ ...selectedItems, [itemId]: next });
    };

    const seatTotal = selectedSeats.reduce((total, id) => {
        const seat = seats.find(s => s.seatId === id);
        return total + (seat ? seat.priceSeat : 0);
    }, 0);

    const foodTotal = Object.entries(selectedItems).reduce((total, [itemId, qty]) => {
        const item = menuItems.find(i => i.itemId === parseInt(itemId));
        return total + (item ? item.basePrice * qty : 0);
    }, 0);

    const screenPrice = showData ? showData.priceScreen : 0;
    const totalAmount = seatTotal + foodTotal + screenPrice;

    const [redeemNachos, setRedeemNachos] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [needsWheelchair, setNeedsWheelchair] = useState(false);

    const handleConfirm = async () => {
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat.');
            return;
        }

        setBookingStatus('booking');

        const bookingData = {
            userId: user.userId || user.id,
            showId: parseInt(showId),
            seats: selectedSeats,
            redeemNachos: redeemNachos,
            paymentMethod: paymentMethod,
            needsWheelchair: needsWheelchair,
            items: Object.entries(selectedItems)
                .filter(([_, qty]) => qty > 0)
                .map(([id, qty]) => ({ itemId: parseInt(id), quantity: qty })),
            totalAmount: totalAmount
        };

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            const data = await res.json();

            if (data.success) {
                setBookingStatus('success');
                setTimeout(() => navigate('/'), 3000);
            } else {
                alert('Error: ' + data.error);
                setBookingStatus(null);
            }
        } catch (error) {
            alert('Booking failed. Please try again.');
            setBookingStatus(null);
        }
    };

    // Group seats by row
    const rows = seats.reduce((acc, seat) => {
        if (!acc[seat.rowNo]) acc[seat.rowNo] = [];
        acc[seat.rowNo].push(seat);
        return acc;
    }, {});

    if (bookingStatus === 'success') {
        return (
            <div className="main-content" style={{ textAlign: 'center', paddingTop: '100px' }}>
                <div style={{ fontSize: '5rem' }}>🍿</div>
                <h1 style={{ color: '#10b981' }}>Booking Confirmed!</h1>
                <p>Your tickets have been reserved. Enjoy your movie!</p>
                <p style={{ color: '#94a3b8' }}>Redirecting to Home...</p>
            </div>
        );
    }

    return (
        <div className="main-content">
            <button className="logout-btn" onClick={() => navigate(-1)} style={{ marginBottom: '2rem' }}>&larr; Back</button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem' }}>
                <div>
                    <h2 style={{ marginBottom: '2rem' }}>Interactive Seat Map</h2>
                    <div style={{background: 'var(--container-bg)', padding: '3rem', borderRadius: '20px', textAlign: 'center', boxShadow: 'var(--shadow)', color: 'var(--container-text)'}}>
                        <div className="screen-divider" style={{marginBottom: '4rem', color: 'var(--container-accent)', borderBottom: '2px solid var(--container-border)'}}>SCREEN</div>
                        {loading ? <div className="loader-spinner"></div> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {Object.entries(seats.reduce((acc, seat) => {
                                    const row = seat.rowNo;
                                    if (!acc[row]) acc[row] = [];
                                    acc[row].push(seat);
                                    return acc;
                                }, {})).sort().map(([rowNo, rowSeats]) => (
                                    <div key={rowNo} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        {rowSeats.map(seat => (
                                            <div
                                                key={seat.seatId}
                                                onClick={() => !seat.isBooked && toggleSeat(seat.seatId)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '4px',
                                                    background: seat.isBooked ? 'var(--input-bg)' : selectedSeats.includes(seat.seatId) ? 'var(--container-accent)' : 'rgba(255,255,255,0.1)',
                                                    color: 'var(--seat-text)',
                                                    border: '1px solid var(--container-border)',
                                                    cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                                                    position: 'relative'
                                                }}
                                            >
                                                {seat.isWheelchairAllow ? '♿' : seat.seatNo}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {seats.length === 0 && (
                                    <div style={{ color: '#94a3b8', padding: '2rem' }}>
                                        <div style={{ fontSize: '2rem' }}>💺 ❓</div>
                                        <p>No seats found for this screen.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <h2 style={{ marginTop: '3rem', marginBottom: '1.5rem' }}>Order Snacks</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {menuItems.map(item => (
                            <div key={item.itemId} style={{
                                background: 'var(--container-bg)', padding: '1rem', borderRadius: '12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                boxShadow: 'var(--shadow)', color: 'var(--container-text)'
                            }}>
                                <div>
                                    <h4 style={{margin: 0}}>{item.itemName}</h4>
                                    <p style={{margin: 0, color: 'var(--container-accent)', fontSize: '0.9rem', fontWeight: '700'}}>Rs. {item.basePrice}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <button onClick={() => updateItemQty(item.itemId, -1)} style={{ width: '25px', height: '25px', borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.1)', color: '#1A1A1A', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontWeight: '700' }}>{selectedItems[item.itemId] || 0}</span>
                                    <button onClick={() => updateItemQty(item.itemId, 1)} style={{ width: '25px', height: '25px', borderRadius: '50%', border: 'none', background: '#6B21A8', color: '#fff', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside style={{background: 'var(--container-bg)', padding: '2rem', borderRadius: '20px', height: 'fit-content', boxShadow: 'var(--shadow)', color: 'var(--container-text)'}}>
                    <h3 style={{marginTop: 0, borderBottom: '1px solid var(--container-border)', paddingBottom: '1rem', color: 'var(--container-text)'}}>Booking Summary</h3>

                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Seats ({selectedSeats.length})</span>
                            <span>Rs. {seatTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Food & Snacks</span>
                            <span>Rs. {foodTotal}</span>
                        </div>
                        <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--container-accent)', fontSize: '0.9rem', fontWeight: '600'}}>
                            <span>Screen Fee ({showData?.typeName})</span>
                            <span>+ Rs. {screenPrice}</span>
                        </div>

                        {user.loyaltyPoints >= 20 && (
                            <div style={{
                                marginTop: '1rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px dashed #5f4a15ff', borderRadius: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b88913ff' }}>
                                    <input
                                        type="checkbox"
                                        id="redeem"
                                        checked={redeemNachos}
                                        onChange={(e) => setRedeemNachos(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="redeem" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                        🎁 Redeem 20 pts for Free Nachos!
                                    </label>
                                </div>
                            </div>
                        )}

                        <div style={{marginTop: '1.5rem'}}>
                            <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--container-accent)', fontWeight: '600'}}>Payment Method</label>
                            <select 
                                value={paymentMethod} 
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.8rem', background: 'var(--input-bg)', 
                                    border: '1px solid var(--container-border)', borderRadius: '8px', color: 'var(--container-text)',
                                    fontSize: '1rem', fontWeight: '500'
                                }}
                            >
                                <option value="Cash">By Cash</option>
                                <option value="Mobile App">By Mobile App</option>
                                <option value="Bank Card">By Bank Card</option>
                            </select>
                        </div>

                        <div style={{
                            marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid #3b82f6', borderRadius: '8px',
                            opacity: seats.some(s => selectedSeats.includes(s.seatId) && s.isWheelchairAllow) ? 1 : 0.5
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e52c1ff' }}>
                                <input
                                    type="checkbox"
                                    id="wheelchair"
                                    disabled={!seats.some(s => selectedSeats.includes(s.seatId) && s.isWheelchairAllow)}
                                    checked={needsWheelchair && seats.some(s => selectedSeats.includes(s.seatId) && s.isWheelchairAllow)}
                                    onChange={(e) => setNeedsWheelchair(e.target.checked)}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="wheelchair" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                                    ♿ Request Wheelchair Assistance
                                    {!seats.some(s => selectedSeats.includes(s.seatId) && s.isWheelchairAllow) &&
                                        <div style={{ fontSize: '0.7rem', color: '#4A1D1F' }}>(Select a ♿ seat to enable)</div>
                                    }
                                </label>
                            </div>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--container-border)', paddingTop: '1rem', fontSize: '1.3rem', fontWeight: '800'}}>
                            <span>Total</span>
                            <span style={{color: 'var(--container-accent)'}}>Rs. {totalAmount}</span>
                        </div>
                    </div>

                    <button
                        className="book-btn"
                        disabled={bookingStatus === 'booking'}
                        onClick={handleConfirm}
                        style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        {bookingStatus === 'booking' ? 'Processing...' : 'Confirm & Book'}
                    </button>
                </aside>
            </div>
        </div>
    );
}

export default SeatSelection;
