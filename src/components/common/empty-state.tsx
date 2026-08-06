import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: LucideIcon;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	title,
	description,
	icon: Icon = InboxIcon,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				'flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
				className,
			)}
		>
			<div className="bg-muted mb-4 flex size-11 items-center justify-center rounded-full">
				<Icon aria-hidden="true" className="text-muted-foreground size-5" />
			</div>
			<h2 className="text-lg font-semibold">{title}</h2>
			{description ? (
				<p className="text-muted-foreground mt-1 max-w-md text-sm">
					{description}
				</p>
			) : null}
			{action ? <div className="mt-5">{action}</div> : null}
		</div>
	);
}
