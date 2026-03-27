import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Login({ onLogin }) {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('theatro_user', JSON.stringify(data.user));
                onLogin(data.user);
                navigate('/');
            } else {
                setError(data.message || 'Login failed');
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

                <h2 className="auth-title">Welcome Back</h2>
                <p className="auth-subtitle">Sign in to continue your cinema experience</p>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            id="login-email"
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
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        id="login-submit-btn"
                        type="submit"
                        className="auth-btn"
                        disabled={loading}
                    >
                        {loading ? <span className="btn-spinner"></span> : 'Sign In'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account?{' '}
                    <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
