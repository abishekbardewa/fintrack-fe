import { CircleAlertIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	title = 'Something went wrong',
	description = 'We could not load this content. Please try again.',
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			className={cn(
				'flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
				className,
			)}
			role="alert"
		>
			<div className="bg-destructive/10 mb-4 flex size-11 items-center justify-center rounded-full">
				<CircleAlertIcon
					aria-hidden="true"
					className="text-destructive size-5"
				/>
			</div>
			<h2 className="text-lg font-semibold">{title}</h2>
			<p className="text-muted-foreground mt-1 max-w-md text-sm">
				{description}
			</p>
			{onRetry ? (
				<Button className="mt-5" onClick={onRetry} type="button">
					Try again
				</Button>
			) : null}
		</div>
	);
}
