import { ChartColumn } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BrandMarkProps {
	className?: string;
	showWordmark?: boolean;
	size?: 'sm' | 'md';
}

export function BrandMark({ className, showWordmark = true, size = 'md' }: BrandMarkProps) {
	const iconBox = size === 'sm' ? 'size-8 rounded-lg' : 'size-10 rounded-xl';
	const icon = size === 'sm' ? 'size-4' : 'size-5';
	const wordmark = size === 'sm' ? 'text-lg' : 'text-2xl';

	return (
		<div className={cn('flex items-center gap-3', className)}>
			<div
				className={cn(
					'flex shrink-0 items-center justify-center bg-primary text-primary-foreground',
					iconBox,
				)}
			>
				<ChartColumn className={icon} aria-hidden="true" />
			</div>
			{showWordmark ? (
				<span className={cn('font-bold tracking-tight text-primary', wordmark)}>FinTrack</span>
			) : null}
		</div>
	);
}
