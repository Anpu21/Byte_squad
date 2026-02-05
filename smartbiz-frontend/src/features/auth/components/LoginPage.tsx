import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, clearError } from '../slices/authSlice';
import { ROUTES } from '@shared/constants/routes';
import './LoginPage.css';

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (error) {
            dispatch(clearError());
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const result = await dispatch(login(formData));

        if (login.fulfilled.match(result)) {
            navigate(ROUTES.ADMIN.DASHBOARD);
        }
    };

    return (
        <div className="login-card glassmorphism">
            <div className="login-card__header">
                <h2 className="login-card__title">Welcome Back</h2>
                <p className="login-card__subtitle">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
                {error && (
                    <div className="login-form__error">
                        <span className="login-form__error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div className="login-form__field">
                    <label htmlFor="username" className="login-form__label">
                        Username
                    </label>
                    <div className="login-form__input-wrapper">
                        <span className="login-form__input-icon">👤</span>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            className="login-form__input"
                            autoComplete="username"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="login-form__field">
                    <label htmlFor="password" className="login-form__label">
                        Password
                    </label>
                    <div className="login-form__input-wrapper">
                        <span className="login-form__input-icon">🔒</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className="login-form__input"
                            autoComplete="current-password"
                            required
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="login-form__toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="login-form__submit"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="login-form__spinner" />
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="login-card__footer">
                <p className="login-card__demo-hint">
                    Demo: admin / password123
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
