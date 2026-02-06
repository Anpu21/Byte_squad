import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { login, clearError } from '../slices/authSlice';
import { ROUTES } from '@shared/constants/routes';
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
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
        <div className="login-card glassmorphism animate-scale-in">
            <div className="login-card__header">
                <div className="login-card__logo">
                    <div className="login-card__logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                            <path
                                d="M12 2L2 7L12 12L22 7L12 2Z"
                                className="fill-accent-primary"
                            />
                            <path
                                d="M2 17L12 22L22 17"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="stroke-accent-secondary"
                            />
                            <path
                                d="M2 12L12 17L22 12"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="stroke-accent-primary"
                            />
                        </svg>
                    </div>
                </div>
                <h2 className="login-card__title">Welcome Back</h2>
                <p className="login-card__subtitle">Sign in to your LedgerPro account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
                {error && (
                    <div className="login-form__error animate-fade-in">
                        <AlertCircle className="login-form__error-icon" size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="login-form__field">
                    <label htmlFor="username" className="login-form__label">
                        Username
                    </label>
                    <div className="login-form__input-wrapper group">
                        <User className="login-form__input-icon transition-colors group-focus-within:text-accent-primary" size={18} />
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
                    <div className="login-form__input-wrapper group">
                        <Lock className="login-form__input-icon transition-colors group-focus-within:text-accent-primary" size={18} />
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
                            {showPassword ? (
                                <EyeOff size={18} className="transition-transform hover:scale-110" />
                            ) : (
                                <Eye size={18} className="transition-transform hover:scale-110" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="login-form__submit group"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={20} />
                    ) : (
                        <>
                            <span>Sign In</span>
                            <svg
                                className="w-5 h-5 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </>
                    )}
                </button>
            </form>

            <div className="login-card__footer">
                <p className="login-card__demo-hint">
                    <span className="text-zinc-500">Demo credentials:</span> admin / password123
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
