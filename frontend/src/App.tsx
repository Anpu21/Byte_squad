import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store/index';
import AppRouter from '@/routes/AppRouter';
import { ConfirmProvider } from '@/hooks/ConfirmProvider';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
        },
    },
});

function App() {
    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <ConfirmProvider>
                    <AppRouter />
                </ConfirmProvider>
                <Toaster
                    position="top-right"
                    gutter={10}
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'var(--surface)',
                            color: 'var(--text-1)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            fontWeight: 500,
                            boxShadow: 'var(--shadow-md)',
                            maxWidth: '420px',
                        },
                        success: {
                            duration: 3000,
                            iconTheme: {
                                primary: 'var(--accent)',
                                secondary: 'var(--surface)',
                            },
                        },
                        error: {
                            duration: 5000,
                            iconTheme: {
                                primary: 'var(--danger)',
                                secondary: 'var(--surface)',
                            },
                        },
                        loading: {
                            iconTheme: {
                                primary: 'var(--primary)',
                                secondary: 'var(--surface)',
                            },
                        },
                    }}
                />
            </QueryClientProvider>
        </Provider>
    );
}

export default App;
