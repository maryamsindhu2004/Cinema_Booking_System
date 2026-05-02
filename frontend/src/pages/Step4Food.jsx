import { useEffect, useState } from "react";
import { useBooking } from "../context/BookingContext";
import { useNavigate } from "react-router-dom";
import useFlowGuard from "../hooks/useFlowGuard";

const API = "http://localhost:3000";

export default function Step4Food() {
    const { booking, updateBooking } = useBooking();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [cart, setCart] = useState(booking.food || {});

    // standardized guard
    useFlowGuard(["movieId", "showtimeId", "seats"]);

    // fetch food items
    useEffect(() => {
        fetch(`${API}/food/items`)
            .then(res => res.json())
            .then(data => setItems(data))
            .catch(err => console.error("Failed to fetch food", err));
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
        <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
            <h2>Step 4: Food & Snacks</h2>

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
                                padding: 15,
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                backgroundColor: qty > 0 ? "#f9f9f9" : "#fff"
                            }}
                        >
                            <div>
                                <strong style={{ fontSize: 16 }}>{item.item_name}</strong>
                                <div style={{ color: "#666" }}>Rs {item.price}</div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                                <button 
                                    onClick={() => removeItem(item)}
                                    style={circleBtn}
                                >-</button>
                                <span style={{ fontWeight: "bold", width: 20, textAlign: "center" }}>{qty}</span>
                                <button 
                                    onClick={() => addItem(item)}
                                    style={circleBtn}
                                >+</button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SUMMARY */}
            <div style={{
                marginTop: 30,
                padding: "20px 0",
                borderTop: "2px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h3 style={{ margin: 0 }}>Total: Rs {total}</h3>
            </div>

            {/* NAVIGATION */}
            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={() => navigate("/step3")} style={secondaryBtn}>Back</button>
                <button
                    onClick={next}
                    style={primaryBtn}
                >
                    {total > 0 ? "Continue" : "Skip Food"}
                </button>
            </div>
        </div>
    );
}

const circleBtn = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18
};

const primaryBtn = {
    padding: "10px 20px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
    flex: 1
};

const secondaryBtn = {
    padding: "10px 20px",
    background: "white",
    color: "black",
    border: "1px solid black",
    borderRadius: 5,
    cursor: "pointer"
};
