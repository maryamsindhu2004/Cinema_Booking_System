import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";
import Layout from "../components/Layout";

const API = "http://localhost:3000";

const itemIcons = {
    "Popcorn": "🍿",
    "Soda": "🥤",
    "Nachos": "🧀",
    "Water": "💧",
    "Coke": "🥤",
    "Pepsi": "🥤",
    "Burger": "🍔",
    "Pizza": "🍕",
    "Hotdog": "🌭"
};

export default function Step4Food() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [cart, setCart] = useState(booking.food || {});

    useFlowGuard(["movieId", "showtimeId", "seats"]);

    useEffect(() => {
        fetch(`${API}/food/items`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error("Failed to fetch food", err));
    }, []);

    function addItem(item) {
        setCart(prev => {
            const qty = prev[item.item_id]?.qty || 0;
            return {
                ...prev,
                [item.item_id]: {
                    item,
                    qty: qty + 1
                }
            };
        });
    }

    function removeItem(item) {
        setCart(prev => {
            const current = prev[item.item_id];
            if (!current) return prev;

            const newQty = current.qty - 1;

            if (newQty <= 0) {
                const copy = { ...prev };
                delete copy[item.item_id];
                return copy;
            }

            return {
                ...prev,
                [item.item_id]: {
                    item,
                    qty: newQty
                }
            };
        });
    }

    const total = Object.values(cart).reduce(
        (sum, c) => sum + c.qty * c.item.price,
        0
    );

    function next() {
        updateBooking({
            food: cart,
            foodTotal: total
        });
        navigate("/step5");
    }

    return (
        <Layout currentStep={5} title="Order Food & Beverages">
            <div className="info-box">
                <strong>ℹ️ Add items</strong> to make your cinema experience better (optional).
            </div>

            <div className="grid">
                {items.map(item => {
                    const qty = cart[item.item_id]?.qty || 0;
                    const icon = Object.keys(itemIcons).find(key => item.item_name.includes(key)) 
                        ? itemIcons[Object.keys(itemIcons).find(key => item.item_name.includes(key))]
                        : "🍴";

                    return (
                        <div
                            key={item.item_id}
                            className={`card ${qty > 0 ? 'selected' : ''}`}
                            style={{ cursor: "default" }}
                        >
                            <div className="card-icon">{icon}</div>
                            <div className="card-title">{item.item_name}</div>
                            <div className="card-price">Rs. {item.price}</div>
                            
                            <div className="qty-controls">
                                <button className="qty-btn" onClick={() => removeItem(item)}>−</button>
                                <input type="text" className="qty-input" value={qty} readOnly />
                                <button className="qty-btn" onClick={() => addItem(item)}>+</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {total > 0 && (
                <div className="summary">
                    <h3>Food & Beverages Summary</h3>
                    {Object.values(cart).map(c => (
                        <div key={c.item.item_id} className="summary-item">
                            <span className="summary-label">{c.item.item_name} (x{c.qty})</span>
                            <span className="summary-value">Rs. {c.qty * c.item.price}</span>
                        </div>
                    ))}
                    <div className="summary-item summary-total">
                        <span className="summary-label">Food Total:</span>
                        <span className="summary-value total-amount">Rs. {total}</span>
                    </div>
                </div>
            )}

            <div className="button-group">
                <button className="btn-secondary" onClick={() => navigate("/step3")}>← Back</button>
                <button className="btn-primary" onClick={next}>
                    {total > 0 ? `Continue to Details (Rs. ${total}) →` : "Skip Food →"}
                </button>
            </div>
        </Layout>
    );
}
