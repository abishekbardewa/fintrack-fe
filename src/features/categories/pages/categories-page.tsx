import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	CategoryKindPanel,
	type CategoryKindPanelHandle,
} from '@/features/categories/components/category-kind-panel';
import type { CategoryKind } from '@/features/categories/types';
import { cn } from '@/lib/utils';

const KIND_FILTERS: { value: CategoryKind; label: string }[] = [
	{ value: 'expense', label: 'Expense' },
	{ value: 'income', label: 'Income' },
];

export function CategoriesPage() {
	const [kind, setKind] = useState<CategoryKind>('expense');
	const panelRef = useRef<CategoryKindPanelHandle>(null);
	const addLabel = kind === 'expense' ? 'New Expense Category' : 'New Income Category';

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1>
					<p className="mt-1 text-sm text-muted-foreground">Group income and expenses.</p>
				</div>
				<Button
					type="button"
					onClick={() => panelRef.current?.openCreateMain()}
					data-testid={`add-main-category-${kind}`}
				>
					<Plus className="size-4" />
					{addLabel}
				</Button>
			</header>

			<div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by kind">
				{KIND_FILTERS.map((item) => {
					const active = kind === item.value;
					return (
						<button
							key={item.value}
							type="button"
							onClick={() => setKind(item.value)}
							className={cn(
								'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
								active
									? 'border-primary/30 bg-primary text-primary-foreground'
									: 'border-border bg-card text-muted-foreground hover:text-foreground',
							)}
							aria-pressed={active}
							data-testid={`category-filter-${item.value}`}
						>
							{item.label}
						</button>
					);
				})}
			</div>

			<CategoryKindPanel key={kind} ref={panelRef} kind={kind} />
		</div>
	);
}
