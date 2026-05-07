import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store/index';
import AppRouter from '@/routes/AppRouter';

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
        <AppRouter />
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111111',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              maxWidth: '420px',
            },
            success: {
              duration: 3000,
              iconTheme: { primary: '#10b981', secondary: '#0a0a0a' },
              style: { borderColor: 'rgba(16,185,129,0.3)' },
            },
            error: {
              duration: 5000,
              iconTheme: { primary: '#f43f5e', secondary: '#0a0a0a' },
              style: { borderColor: 'rgba(244,63,94,0.3)' },
            },
            loading: {
              iconTheme: { primary: '#ffffff', secondary: '#0a0a0a' },
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
