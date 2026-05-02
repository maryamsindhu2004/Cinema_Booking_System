import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function Home() {
    const steps = [
        { id: "1️⃣", title: "Movie", desc: "Select from available movies" },
        { id: "2️⃣", title: "Timing", desc: "Choose show time" },
        { id: "3️⃣", title: "Screen", desc: "Select screen type" },
        { id: "4️⃣", title: "Seat", desc: "Pick seat category" },
        { id: "5️⃣", title: "Food", desc: "Add snacks (optional)" },
        { id: "6️⃣", title: "Payment", desc: "Choose payment method" },
        { id: "7️⃣", title: "Confirmation", desc: "Get booking reference" }
    ];

    return (
        <Layout currentStep={0} title="Welcome to Cinema Booking System">
            <div className="info-box">
                <strong>ℹ️ Get Started</strong> by clicking the button below to begin your booking journey.
            </div>

            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p style={{ fontSize: "1.2em", color: "#666", marginBottom: "30px" }}>
                    Complete 7-Step Booking Flow:
                </p>
                <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                    gap: "15px", 
                    maxWidth: "800px", 
                    margin: "0 auto" 
                }}>
                    {steps.map((step, index) => (
                        <div key={index} style={{ 
                            background: "#f8f9fa", 
                            padding: "20px", 
                            borderRaudius: "10px",
                            border: index === 0 ? "2px solid #667eea" : "none"
                        }}>
                            <div style={{ fontSize: "2em", marginBottom: "10px" }}>{step.id}</div>
                            <div style={{ fontWeight: "bold" }}>{step.title}</div>
                            <div style={{ fontSize: "0.9em", color: "#666" }}>{step.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="button-group" style={{ marginTop: "50px" }}>
                <Link to="/step1" className="btn-primary" style={{ textDecoration: "none" }}>
                    Start Booking
                </Link>
            </div>
        </Layout>
    );
}
