import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Register({ onLogin }) {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirm) {
            return setError('Passwords do not match');
        }
        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password
                })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('theatro_user', JSON.stringify(data.user));
                onLogin(data.user);
                navigate('/');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Could not connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Animated Background */}
            <div className="auth-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            <div className="auth-card">
                <div className="auth-logo">
                    <span className="logo-icon">🎭</span>
                    <h1>THEATRO</h1>
                    <p className="logo-sub">Cinemas</p>
                </div>

                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Join THEATRO and discover amazing movies</p>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="reg-name">Full Name</label>
                        <input
                            id="reg-name"
                            type="text"
                            name="name"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            required
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            name="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="reg-confirm">Confirm Password</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            name="confirm"
                            placeholder="••••••••"
                            value={form.confirm}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        id="register-submit-btn"
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="btn-spinner"></span> : 'Create Account'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
