import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import { AppProviders } from '@/app/providers';
import { ErrorBoundary } from '@/components/common/error-boundary';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AppProviders>
			<ErrorBoundary>
				<App />
			</ErrorBoundary>
		</AppProviders>
	</StrictMode>,
);
