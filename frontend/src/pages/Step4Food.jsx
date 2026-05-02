import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:3000";

export default function Step4Food() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [cart, setCart] = useState({});

    // guard
    useEffect(() => {
        if (!booking.seats) {
            navigate("/step1");
        }
    }, []);

    // fetch food items
    useEffect(() => {
        fetch(`${API}/food/items`)
            .then(res => res.json())
            .then(data => setItems(data));
    }, []);

    // add item
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

    // remove item
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

    // calculate total
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
        <div style={{ padding: 20 }}>
            <h2>Food & Snacks</h2>

            {/* FOOD LIST */}
            <div style={{ display: "grid", gap: 10 }}>
                {items.map(item => {
                    const qty = cart[item.item_id]?.qty || 0;

                    return (
                        <div
                            key={item.item_id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: 10,
                                border: "1px solid #ddd",
                                borderRadius: 6
                            }}
                        >
                            <div>
                                <strong>{item.item_name}</strong>
                                <div>Rs {item.price}</div>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => removeItem(item)}>-</button>
                                <span>{qty}</span>
                                <button onClick={() => addItem(item)}>+</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SUMMARY */}
            <div style={{
                marginTop: 20,
                padding: 10,
                borderTop: "2px solid black"
            }}>
                <h3>Total: Rs {total}</h3>
            </div>

            {/* NEXT */}
            <button
                disabled={total === 0}
                onClick={next}
                style={{
                    marginTop: 10,
                    padding: "10px 20px",
                    background: "black",
                    color: "white",
                    border: "none",
                    borderRadius: 5
                }}
            >
                Continue
            </button>
        </div>
    );
}
