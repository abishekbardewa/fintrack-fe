import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/components/common/error-state';

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		if (import.meta.env.DEV) {
			console.error('Uncaught application error:', error, errorInfo);
		}
	}

	private reset = () => {
		this.setState({ hasError: false });
	};

	render() {
		if (this.state.hasError) {
			return (
				<main className="flex min-h-screen items-center justify-center p-6">
					<ErrorState
						className="w-full max-w-xl"
						description="An unexpected error occurred. Try again, or refresh the page if the problem continues."
						onRetry={this.reset}
					/>
				</main>
			);
		}

		return this.props.children;
	}
}
