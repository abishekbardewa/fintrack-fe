import {
	ArrowLeftRight,
	Sparkles,
} from 'lucide-react';

import { ComingSoonPage } from '@/components/common/coming-soon-page';

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
