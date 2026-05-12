import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes.config';
import { SmartRedirect } from './SmartRedirect';
import { buildRouteElement } from './buildRouteElement';
import { NotFoundPage } from '@/pages/NotFoundPage';

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SmartRedirect />} />
                {ROUTES.map((def) => (
                    <Route
                        key={def.path}
                        path={def.path}
                        element={buildRouteElement(def)}
                    />
                ))}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
