import { forwardRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ConfirmDeleteFact {
	label: string;
	value?: string | null;
}

interface ConfirmDeleteDetailsProps {
	facts: ConfirmDeleteFact[];
	notes: string[];
}

export function ConfirmDeleteDetails({ facts, notes }: ConfirmDeleteDetailsProps) {
	const visibleFacts = facts.filter((fact) => fact.value != null && fact.value !== '');

	return (
		<div className="space-y-3 text-sm text-muted-foreground">
			{visibleFacts.length > 0 ? (
				<dl className="space-y-1.5">
					{visibleFacts.map((fact) => (
						<div key={fact.label} className="flex items-start justify-between gap-3">
							<dt className="shrink-0">{fact.label}</dt>
							<dd className="min-w-0 text-right font-medium text-foreground tabular-nums">
								{fact.value}
							</dd>
						</div>
					))}
				</dl>
			) : null}
			{notes.length > 0 ? (
				<ul className="list-disc space-y-1 pl-4">
					{notes.map((note) => (
						<li key={note}>{note}</li>
					))}
				</ul>
			) : null}
		</div>
	);
}

export function ConfirmHighlight({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<span className={cn('font-semibold text-foreground', className)}>{children}</span>
	);
}

export const ConfirmCopy = forwardRef<
	HTMLDivElement,
	{ lead: ReactNode; body: ReactNode }
>(function ConfirmCopy({ lead, body }, ref) {
	return (
		<div ref={ref} className="w-full space-y-3 text-sm text-muted-foreground">
			<p>{lead}</p>
			<p>{body}</p>
		</div>
	);
});
