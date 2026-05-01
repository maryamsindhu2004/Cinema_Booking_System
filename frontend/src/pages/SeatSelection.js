import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SeatSelection() {
    const { showId } = useParams();
    const navigate = useNavigate();
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);

    useEffect(() => {
        fetch(`/api/shows/${showId}/seats`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setSeats(data.data);
                setLoading(true); // Small delay for effect
                setTimeout(() => setLoading(false), 500);
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

    const totalPrice = selectedSeats.reduce((total, seatId) => {
        const seat = seats.find(s => s.seatId === seatId);
        return total + (seat ? seat.priceSeat : 0);
    }, 0);

    // Group seats by row
    const rows = seats.reduce((acc, seat) => {
        if (!acc[seat.rowNo]) acc[seat.rowNo] = [];
        acc[seat.rowNo].push(seat);
        return acc;
    }, {});

    return (
        <div className="main-content">
            <button className="logout-btn" onClick={() => navigate(-1)} style={{marginBottom: '2rem'}}>
                &larr; Back to Shows
            </button>

            <div className="section-header">
                <h2>Select Your Seats</h2>
                <p>Choose your preferred seats in the theater</p>
            </div>

            <div className="booking-layout" style={{display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem'}}>
                <div className="seat-map-container">
                    <div className="screen-divider" style={{
                        height: '6px', 
                        background: 'linear-gradient(90deg, transparent, #FF3366, transparent)', 
                        borderRadius: '10px',
                        marginBottom: '4rem',
                        textAlign: 'center',
                        color: 'rgba(255,51,102,0.5)',
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '5px'
                    }}>
                        SCREEN
                    </div>

                    {loading ? (
                        <div className="loader">
                            <div className="loader-spinner"></div>
                        </div>
                    ) : (
                        <div className="rows-container" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                            {Object.entries(rows).map(([rowNo, rowSeats]) => (
                                <div key={rowNo} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem'}}>
                                    <span style={{width: '20px', color: '#94a3b8', fontWeight: '700'}}>{rowNo}</span>
                                    <div style={{display: 'flex', gap: '0.5rem'}}>
                                        {rowSeats.map(seat => {
                                            const isSelected = selectedSeats.includes(seat.seatId);
                                            const isBooked = seat.isBooked;
                                            return (
                                                <div 
                                                    key={seat.seatId}
                                                    onClick={() => !isBooked && toggleSeat(seat.seatId)}
                                                    style={{
                                                        width: '35px',
                                                        height: '35px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '700',
                                                        cursor: isBooked ? 'not-allowed' : 'pointer',
                                                        background: isBooked ? '#334155' : isSelected ? '#FF3366' : 'rgba(255,255,255,0.05)',
                                                        border: `1px solid ${isBooked ? '#475569' : isSelected ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
                                                        color: isBooked ? '#64748b' : isSelected ? '#fff' : '#94a3b8',
                                                        transition: 'all 0.2s',
                                                        position: 'relative'
                                                    }}
                                                    title={`${seat.category} - Rs. ${seat.priceSeat}`}
                                                >
                                                    {seat.seatNo}
                                                    {seat.isWheelchairAllow === 1 && <span style={{position: 'absolute', bottom: '-2px', right: '-2px', fontSize: '0.5rem'}}>♿</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span style={{width: '20px', color: '#94a3b8', fontWeight: '700'}}>{rowNo}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="legend" style={{marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '2rem'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8'}}>
                            <div style={{width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}></div> Available
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8'}}>
                            <div style={{width: '15px', height: '15px', borderRadius: '3px', background: '#FF3366'}}></div> Selected
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#94a3b8'}}>
                            <div style={{width: '15px', height: '15px', borderRadius: '3px', background: '#334155'}}></div> Occupied
                        </div>
                    </div>
                </div>

                <aside className="booking-summary" style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '20px',
                    padding: '2rem',
                    height: 'fit-content',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <h3 style={{marginTop: 0, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem'}}>Order Summary</h3>
                    
                    {selectedSeats.length > 0 ? (
                        <>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem'}}>
                                {selectedSeats.map(id => {
                                    const seat = seats.find(s => s.seatId === id);
                                    return (
                                        <div key={id} style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
                                            <span>Seat {seat.rowNo}{seat.seatNo} <small style={{color: '#94a3b8'}}>({seat.category})</small></span>
                                            <span style={{fontWeight: '600'}}>Rs. {seat.priceSeat}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginBottom: '2rem'}}>
                                <span style={{fontWeight: '700', fontSize: '1.1rem'}}>Total Amount</span>
                                <span style={{fontWeight: '800', fontSize: '1.3rem', color: '#FF3366'}}>Rs. {totalPrice}</span>
                            </div>
                            <button className="book-btn" style={{width: '100%', padding: '1rem'}} onClick={() => alert('Booking logic coming soon!')}>
                                Confirm Booking
                            </button>
                        </>
                    ) : (
                        <div style={{textAlign: 'center', color: '#94a3b8', padding: '2rem 0'}}>
                            <p>No seats selected</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

export default SeatSelection;
