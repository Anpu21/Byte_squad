import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = () => {
    return (
        <div className="auth-layout">
            <div className="auth-layout__background">
                <div className="auth-layout__gradient-orb auth-layout__gradient-orb--1" />
                <div className="auth-layout__gradient-orb auth-layout__gradient-orb--2" />
                <div className="auth-layout__gradient-orb auth-layout__gradient-orb--3" />
            </div>

            <div className="auth-layout__container">
                <div className="auth-layout__branding">
                    <div className="auth-layout__logo">
                        <span className="auth-layout__logo-icon">📊</span>
                        <h1 className="auth-layout__title">
                            Smart<span className="gradient-text">Biz</span> ERP
                        </h1>
                    </div>
                    <p className="auth-layout__tagline">
                        Modern Desktop Accounting & Inventory Management
                    </p>
                </div>

                <div className="auth-layout__content">
                    <Outlet />
                </div>

                <footer className="auth-layout__footer">
                    <p>© 2026 SmartBiz ERP. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default AuthLayout;
