import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Provider as ReduxProvider } from 'react-redux';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { store } from '@/app/store';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});

interface AppProvidersProps {
	children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			storageKey="fintrack-theme"
			disableTransitionOnChange
		>
			<ReduxProvider store={store}>
				<QueryClientProvider client={queryClient}>
					<TooltipProvider delayDuration={300}>
						{children}
						<Toaster richColors position="top-right" />
					</TooltipProvider>
				</QueryClientProvider>
			</ReduxProvider>
		</ThemeProvider>
	);
}
