import { Sparkles } from 'lucide-react';

import { EmptyState } from '@/components/common/empty-state';

export function ReviewsPage() {
	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					AI Financial Review
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">Insights that feel personal, not generic.</p>
			</header>

			<EmptyState icon={Sparkles} title="Coming soon" description="This feature is on the way." />
		</div>
	);
}
