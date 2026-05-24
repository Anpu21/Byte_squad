import { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Build a Query test wrapper. Each test gets a fresh client with retry
 * disabled so a rejecting mock surfaces as an error result immediately
 * rather than retrying for 30 seconds.
 */
export function makeWrapper(): {
  Wrapper: (props: PropsWithChildren) => React.ReactElement;
  client: QueryClient;
} {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}
