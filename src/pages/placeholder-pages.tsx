import {
	ArrowLeftRight,
	Sparkles,
	Target,
	TrendingUp,
	Wallet,
} from 'lucide-react';

import { ComingSoonPage } from '@/components/common/coming-soon-page';

export function BudgetsPage() {
	return (
		<ComingSoonPage
			title="Budgets"
			description="Set monthly or weekly limits and track progress."
			icon={Wallet}
		/>
	);
}

export function GoalsPage() {
	return (
		<ComingSoonPage
			title="Goals"
			description="Track savings goals and manual contributions."
			icon={Target}
		/>
	);
}

export function TrendsPage() {
	return (
		<ComingSoonPage
			title="Trends"
			description="Time-series charts for net, income, and expense."
			icon={TrendingUp}
		/>
	);
}

export function ReviewsPage() {
	return (
		<ComingSoonPage
			title="Reviews"
			description="On-demand monthly AI reviews of your finances."
			icon={Sparkles}
		/>
	);
}

export function ImportExportPage() {
	return (
		<ComingSoonPage
			title="Import / Export"
			description="Download templates and upload transaction files."
			icon={ArrowLeftRight}
		/>
	);
}
