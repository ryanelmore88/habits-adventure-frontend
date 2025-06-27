// File: frontend/src/components/Auth/LoginPage.jsx
// Login component

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Auth.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            navigate('/characters');
        } else {
            setErrors({ general: result.error });
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Welcome Back, Adventurer!</h2>
                    <p className="auth-subtitle">Login to continue your journey</p>

                    {errors.general && (
                        <div className="auth-error-message">
                            {errors.general}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="adventurer@example.com"
                            disabled={loading}
                        />
                        {errors.email && (
                            <span className="field-error">{errors.email}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Enter your password"
                            disabled={loading}
                        />
                        {errors.password && (
                            <span className="field-error">{errors.password}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="auth-links">
                        <p>New to Habits Adventure? <Link to="/register">Create an account</Link></p>
                        <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;