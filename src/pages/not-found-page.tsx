import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
	return (
		<main className="page-container flex min-h-screen items-center justify-center py-16 text-center">
			<div className="max-w-lg">
				<p className="text-primary text-sm font-semibold">404</p>
				<h1 className="mt-2 text-3xl font-bold tracking-tight">
					Page not found
				</h1>
				<p className="text-muted-foreground mt-3">
					The page you requested does not exist or may have moved.
				</p>
				<Button asChild className="mt-6">
					<Link to="/login">
						<ArrowLeftIcon aria-hidden="true" />
						Back to FinTrack
					</Link>
				</Button>
			</div>
		</main>
	);
}
