import React, { useState, useEffect } from 'react';

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  modal: { background:'#0a0a0a', borderRadius:16, width:'100%', maxWidth:680, maxHeight:'92vh', overflowY:'auto', padding:28, border:'1px solid #2a2a4a' },
  hdr: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  card: { background:'#121212', border:'1px solid #1e1e30', borderRadius:10, padding:'14px 18px', marginBottom:10, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' },
  cardHover: { border:'1px solid #bb86fc' },
  btn: (c='#bb86fc') => ({ background:c, color:'#000', border:'none', padding:'10px 22px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:14 }),
  input: { padding:'10px 14px', background:'#050505', border:'1px solid #333', borderRadius:8, color:'#fff', fontSize:14, width:'100%', boxSizing:'border-box' },
  sub: { color:'#888', fontSize:13 },
  err: { color:'#ff5252', fontSize:13, marginTop:8 },
  ok: { color:'#bb86fc', fontSize:13, marginTop:8 },
  sep: { borderTop:'1px solid #1e1e30', paddingTop:16, marginTop:16 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  tag: c => ({ color:c, fontSize:12, marginRight:12 }),
  seat: c => ({ width:32, height:28, borderRadius:4, background:c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#fff', fontWeight:700, cursor:'pointer', flexShrink:0 }),
  stepDot: a => ({ width:24, height:24, borderRadius:'50%', background:a?'#bb86fc':'#1e1e30', display:'flex', alignItems:'center', justifyContent:'center', color:a?'#000':'#555', fontSize:11, fontWeight:700 }),
};

const STEPS = ['Screen','Date','Timing','Seats','More?','Food','Confirm','Done'];
const isTuesday = d => new Date(d).getDay() === 2;

export default function BookingModal({ movie, user, onClose }) {
  const [step, setStep] = useState(1);
  const [screens, setScreens] = useState([]);
  const [dates, setDates] = useState([]);
  const [timings, setTimings] = useState([]);
  const [seats, setSeats] = useState([]);
  const [menu, setMenu] = useState([]);

  const [selScreen, setSelScreen] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [selShow, setSelShow] = useState(null);
  const [selSeats, setSelSeats] = useState([]);
  const [foodOrder, setFoodOrder] = useState({});
  const [payMethod, setPayMethod] = useState('Credit Card');

  const [bookingId, setBookingId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Fetch screens on open
  useEffect(() => {
    fetch(`/api/screens?movieId=${movie.movieId}`).then(r=>r.json()).then(d=>{ if(d.success) setScreens(d.data); });
  }, [movie.movieId]);

  const pickScreen = (sc) => {
    setSelScreen(sc); setLoading(true);
    fetch(`/api/show-dates?movieId=${movie.movieId}&screenId=${sc.screenId}`).then(r=>r.json()).then(d=>{
      if(d.success) setDates(d.data); setLoading(false); setStep(2);
    });
  };

  const pickDate = (dt) => {
    setSelDate(dt); setLoading(true);
    fetch(`/api/show-timings?movieId=${movie.movieId}&screenId=${selScreen.screenId}&date=${dt.showDate}`).then(r=>r.json()).then(d=>{
      if(d.success) setTimings(d.data); setLoading(false); setStep(3);
    });
  };

  const pickTiming = (show) => {
    setSelShow(show); setLoading(true);
    fetch(`/api/seats/${show.showId}`).then(r=>r.json()).then(d=>{
      if(d.success) setSeats(d.data); setLoading(false); setStep(4);
    });
  };

  const toggleSeat = (seat) => {
    if(seat.Status==='Booked') return;
    setSelSeats(prev => prev.find(s=>s.seatId===seat.seatId) ? prev.filter(s=>s.seatId!==seat.seatId) : [...prev, seat]);
  };

  const seatsByRow = seats.reduce((acc,s)=>{ const r=s.rowNo||'A'; if(!acc[r]) acc[r]=[]; acc[r].push(s); return acc; }, {});

  // Step 6: Food quantities
  const setQty = (id, delta) => setFoodOrder(prev => {
    const qty = Math.max(0, (prev[id]||0) + delta);
    if(qty===0) { const n={...prev}; delete n[id]; return n; }
    return {...prev, [id]:qty};
  });

  // Step 7: Confirm booking
  const doBooking = async () => {
    setLoading(true); setMsg('');
    const discount = isTuesday(selDate?.showDate) ? 'SAVE10' : null;
    const res = await fetch('/api/book-ticket', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId:user.id, showId:selShow.showId, seatIds:selSeats.map(s=>s.seatId), discountCode:discount })
    });
    const data = await res.json();
    if(!data.success) { setMsg('❌ '+data.error); setLoading(false); return; }
    const bId = data.bookingId;
    setBookingId(bId); setTotalAmount(data.totalAmount);

    // Process food if any
    const items = Object.entries(foodOrder);
    if(items.length > 0) {
      const itemsStr = items.map(([id,qty])=>`${id}:${qty}`).join(',');
      await fetch('/api/food-order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bookingId:bId, items:itemsStr }) });
    }
    setLoading(false); setStep(8);
  };

  // Summary calculations
  const seatTotal = selSeats.reduce((s,seat) => s + parseFloat(seat.BaseSeatPrice||0), 0);
  const screenPrice = parseFloat(selScreen?.ScreenPrice||0);
  const foodTotal = Object.entries(foodOrder).reduce((s,[id,qty]) => { const item = menu.find(m=>m.itemId===parseInt(id)); return s + (item?item.basePrice*qty:0); }, 0);
  const tuesdayDiscount = selDate && isTuesday(selDate.showDate) ? (seatTotal+screenPrice)*0.10 : 0;
  const grandTotal = (seatTotal + screenPrice + foodTotal - tuesdayDiscount).toFixed(2);

  // Load menu when reaching food step
  useEffect(() => {
    if(step===6 && menu.length===0)
      fetch('/api/menu').then(r=>r.json()).then(d=>{ if(d.success) setMenu(d.data); });
  }, [step]);

  return (
    <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={S.hdr}>
          <h2 style={{color:'#fff',margin:0,fontSize:19}}>🎬 {movie.title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#aaa',fontSize:24,cursor:'pointer'}}>✕</button>
        </div>

        {/* Step Bar */}
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:20,padding:'10px 14px',background:'#0f0f23',borderRadius:8,flexWrap:'wrap'}}>
          {STEPS.map((lbl,i) => (
            <React.Fragment key={i}>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <div style={S.stepDot(step>=i+1)}>{step>i+1?'✓':i+1}</div>
                <span style={{color:step===i+1?'#e94560':'#555',fontSize:11}}>{lbl}</span>
              </div>
              {i<7 && <span style={{color:'#333',fontSize:10}}>›</span>}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 — Select Screen */}
        {step===1 && (
          <div>
            <h3 style={{color:'#e94560',marginBottom:12}}>Select a Screen</h3>
            {screens.length===0 ? <p style={S.sub}>No screens available.</p> : screens.map(sc=>(
              <div key={sc.screenId} style={S.card} onClick={()=>pickScreen(sc)}>
                <div>
                  <div style={{color:'#fff',fontWeight:700}}>{sc.CinemaName}</div>
                  <div style={S.sub}>{sc.CinemaLocation}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{color:'#e94560',fontWeight:700}}>{sc.ScreenType}</div>
                  <div style={{color:'#4CAF50',fontSize:12}}>Rs. {sc.ScreenPrice} • {sc.totalSeats} seats</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 2 — Select Date */}
        {step===2 && (
          <div>
            <button onClick={()=>setStep(1)} style={{background:'none',border:'none',color:'#e94560',cursor:'pointer',marginBottom:12}}>← Back</button>
            <h3 style={{color:'#e94560',marginBottom:4}}>Select a Date</h3>
            <p style={S.sub}>{selScreen?.CinemaName} — {selScreen?.ScreenType}</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10,marginTop:12}}>
              {dates.length === 0 ? <p style={S.sub}>No upcoming dates for this screen.</p> : dates.map(dt=>(
                <div key={dt.showDate} onClick={()=>pickDate(dt)} style={{...S.card, flexDirection:'column', alignItems:'center', position:'relative', minHeight:80, textAlign:'center'}}>
                  {isTuesday(dt.showDate) && <span style={{position:'absolute',top:4,right:4,background:'#f0c040',color:'#111',fontSize:9,fontWeight:700,borderRadius:4,padding:'2px 4px'}}>10% OFF</span>}
                  <div style={{color:'#e94560',fontWeight:700,fontSize:15}}>{dt.dayName}</div>
                  <div style={{color:'#fff', fontSize:14}}>{dt.showDate}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — Select Timing */}
        {step===3 && (
          <div>
            <button onClick={()=>setStep(2)} style={{background:'none',border:'none',color:'#e94560',cursor:'pointer',marginBottom:12}}>← Back</button>
            <h3 style={{color:'#e94560',marginBottom:4}}>Select a Timing</h3>
            <p style={S.sub}>{selDate?.dayName} — {selDate?.showDate}</p>
            {timings.map(t=>(
              <div key={t.showId} style={S.card} onClick={()=>pickTiming(t)}>
                <div style={{color:'#e94560',fontWeight:700,fontSize:20}}>{t.startTime} – {t.endTime}</div>
                <div style={{color:'#4CAF50',fontSize:13}}>{t.AvailableSeats} seats available</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4 — Select Seats */}
        {step===4 && (
          <div>
            <button onClick={()=>setStep(3)} style={{background:'none',border:'none',color:'#e94560',cursor:'pointer',marginBottom:8}}>← Back</button>
            <p style={{...S.sub,textAlign:'center'}}>{selScreen?.ScreenType} • {selDate?.showDate} • {selShow?.startTime}–{selShow?.endTime}</p>
            
            {/* Seat Legend */}
            <div style={{display:'flex',gap:15,justifyContent:'center',marginBottom:15,fontSize:11,color:'#aaa'}}>
              <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:12,height:12,background:'#4CAF50',borderRadius:2}}></div> Normal</div>
              <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:12,height:12,background:'#ffd700',borderRadius:2}}></div> Premium</div>
              <div style={{display:'flex',alignItems:'center',gap:5}}><span>♿</span> Wheelchair</div>
              <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:12,height:12,background:'#f0c040',borderRadius:2}}></div> Selected</div>
            </div>

            <div style={{background:'#e94560',textAlign:'center',borderRadius:4,padding:5,color:'#fff',fontSize:12,marginBottom:14,letterSpacing:4}}>── SCREEN ──</div>
            
            {Object.entries(seatsByRow).map(([row,rowSeats])=>(
              <div key={row} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{color:'#666',width:20,fontSize:12,fontWeight:700}}>{row}</span>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {rowSeats.map(seat=>{
                    const isSel = selSeats.find(s=>s.seatId===seat.seatId);
                    const isOcc = seat.Status==='Booked';
                    const isPremium = seat.SeatCategory === 'Premium';
                    
                    let bg = isOcc ? '#1a1a2e' : (isSel ? '#f0c040' : (isPremium ? '#ffd70033' : '#4CAF50'));
                    let border = isPremium && !isSel ? '1px solid #ffd700' : '1px solid #444';
                    
                    return (
                      <div key={seat.seatId} 
                        onClick={()=>toggleSeat(seat)} 
                        title={`${seat.SeatCategory} - Rs.${seat.BaseSeatPrice}`} 
                        style={{
                          ...S.seat(bg), 
                          border, 
                          color: isPremium && !isSel ? '#ffd700' : '#fff',
                          opacity: isOcc ? 0.3 : 1
                        }}>
                        {seat.isWheelchairAllow ? '♿' : seat.seatNo}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{...S.sep,...S.row}}>
              <span style={S.sub}>{selSeats.length} seat(s) — Rs.{(seatTotal+screenPrice).toFixed(2)}</span>
              <button onClick={()=>{if(!selSeats.length){setMsg('Select at least one seat.');return;} setMsg(''); setStep(5);}} style={S.btn()}>Next →</button>
            </div>
            {msg && <p style={S.err}>{msg}</p>}
          </div>
        )}

        {/* STEP 5 — Book Another? (Recursive concept) */}
        {step===5 && (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>🎟️</div>
            <h3 style={{color:'#fff'}}>Add Another Ticket?</h3>
            <p style={S.sub}>You have selected: {selSeats.map(s=>s.seatNo).join(', ')}</p>
            <p style={{...S.sub,marginTop:4}}>Would you like to add more seats to this booking?</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',marginTop:24}}>
              <button onClick={()=>setStep(4)} style={S.btn('#2a5a3a')}>Yes, Add More Seats</button>
              <button onClick={()=>setStep(6)} style={S.btn()}>No, Proceed to Food →</button>
            </div>
          </div>
        )}

        {/* STEP 6 — Food Order */}
        {step===6 && (
          <div>
            <h3 style={{color:'#e94560',marginBottom:4}}>Order Food & Drinks</h3>
            <p style={S.sub}>Optional — add items to enjoy during the show</p>
            {menu.length===0 ? <p style={S.sub}>Loading menu…</p> : (
              ['Snacks','Beverages','Food','Dessert'].map(cat=>{
                const catItems = menu.filter(i=>i.category===cat);
                if(!catItems.length) return null;
                return (
                  <div key={cat} style={{marginTop:14}}>
                    <div style={{color:'#888',fontSize:12,fontWeight:700,marginBottom:6,letterSpacing:1}}>{cat.toUpperCase()}</div>
                    {catItems.map(item=>(
                      <div key={item.itemId} style={{...S.card,padding:'10px 14px'}}>
                        <div>
                          <div style={{color:'#fff'}}>{item.itemName}</div>
                          <div style={{color:'#e94560',fontSize:13}}>Rs. {item.basePrice}</div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <button onClick={()=>setQty(item.itemId,-1)} style={{...S.btn('#333'),padding:'4px 10px'}}>−</button>
                          <span style={{color:'#fff',fontWeight:700,minWidth:20,textAlign:'center'}}>{foodOrder[item.itemId]||0}</span>
                          <button onClick={()=>setQty(item.itemId,1)} style={{...S.btn('#4CAF50'),padding:'4px 10px'}}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
            <div style={{...S.sep,...S.row}}>
              <span style={S.sub}>Food Total: Rs. {foodTotal.toFixed(2)}</span>
              <button onClick={()=>setStep(7)} style={S.btn()}>Next →</button>
            </div>
          </div>
        )}

        {/* STEP 7 — Confirm Booking */}
        {step===7 && (
          <div>
            <h3 style={{color:'#e94560',marginBottom:12}}>Confirm Your Booking</h3>
            <div style={{background:'#0f0f23',borderRadius:10,padding:16,marginBottom:16}}>
              <div style={S.row}><span style={S.sub}>Movie</span><span style={{color:'#fff'}}>{movie.title}</span></div>
              <div style={{...S.row,marginTop:8}}><span style={S.sub}>Cinema</span><span style={{color:'#fff'}}>{selScreen?.CinemaName}</span></div>
              <div style={{...S.row,marginTop:8}}><span style={S.sub}>Screen</span><span style={{color:'#fff'}}>{selScreen?.ScreenType}</span></div>
              <div style={{...S.row,marginTop:8}}><span style={S.sub}>Date & Time</span><span style={{color:'#fff'}}>{selDate?.showDate} at {selShow?.startTime}</span></div>
              <div style={{...S.row,marginTop:8}}><span style={S.sub}>Seats</span><span style={{color:'#fff'}}>{selSeats.map(s=>s.seatNo).join(', ')}</span></div>
              <div style={{borderTop:'1px solid #2a2a4a',marginTop:12,paddingTop:12}}>
                <div style={S.row}><span style={S.sub}>Ticket Price</span><span style={{color:'#fff'}}>Rs. {(seatTotal+screenPrice).toFixed(2)}</span></div>
                {foodTotal>0 && <div style={{...S.row,marginTop:4}}><span style={S.sub}>Food</span><span style={{color:'#fff'}}>Rs. {foodTotal.toFixed(2)}</span></div>}
                {tuesdayDiscount>0 && <div style={{...S.row,marginTop:4}}><span style={{color:'#f0c040'}}>Tuesday Discount (10%)</span><span style={{color:'#f0c040'}}>− Rs. {tuesdayDiscount.toFixed(2)}</span></div>}
                <div style={{...S.row,marginTop:8}}><span style={{color:'#fff',fontWeight:700}}>Total</span><span style={{color:'#e94560',fontWeight:700,fontSize:20}}>Rs. {grandTotal}</span></div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.sub}>Payment Method</label>
              <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{...S.input,marginTop:6}}>
                <option>Credit Card</option><option>Debit Card</option><option>Mobile Wallet</option><option>Cash</option>
              </select>
            </div>
            {msg && <p style={S.err}>{msg}</p>}
            <div style={S.row}>
              <button onClick={()=>setStep(6)} style={S.btn('#333')}>← Back</button>
              <button onClick={doBooking} disabled={loading} style={S.btn()}>{loading?'Processing…':'✓ Confirm Booking'}</button>
            </div>
          </div>
        )}

        {/* STEP 8 — Done */}
        {step===8 && (
          <div style={{textAlign:'center',padding:'30px 0'}}>
            <div style={{fontSize:60}}>🎉</div>
            <h3 style={{color:'#4CAF50',margin:'16px 0 8px'}}>Booking Confirmed!</h3>
            <p style={S.sub}>Booking ID: #{bookingId}</p>
            <p style={{color:'#e94560',fontWeight:700,fontSize:18,margin:'8px 0'}}>Total Paid: Rs. {grandTotal}</p>
            {tuesdayDiscount>0 && <p style={{color:'#f0c040',fontSize:13}}>🎊 Tuesday discount applied — You saved Rs. {tuesdayDiscount.toFixed(2)}!</p>}
            <div style={{...S.sep,marginTop:24}}>
              <p style={{color:'#fff',marginBottom:12}}>Rate your experience:</p>
              <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:12}}>
                {[1,2,3,4,5].map(n=><span key={n} onClick={()=>setRating(n)} style={{fontSize:32,cursor:'pointer',color:n<=rating?'#f0c040':'#444'}}>★</span>)}
              </div>
              <textarea placeholder="Leave a comment (optional)…" value={comments} onChange={e=>setComments(e.target.value)} style={{...S.input,minHeight:70,resize:'vertical',marginBottom:12}}/>
              <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                <button onClick={onClose} style={S.btn('#333')}>Skip & Close</button>
                <button onClick={async()=>{
                  await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:user.id,bookingId,rating,comments})});
                  onClose();
                }} style={S.btn()}>Submit & Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
