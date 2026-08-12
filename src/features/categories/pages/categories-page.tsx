import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { CategoryKindPanel } from '@/features/categories/components/category-kind-panel';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import type { CategoryKind } from '@/features/categories/types';
import { cn } from '@/lib/utils';

const KIND_FILTERS: { value: CategoryKind; label: string }[] = [
	{ value: 'expense', label: 'Expense' },
	{ value: 'income', label: 'Income' },
];

export function CategoriesPage() {
	const [kind, setKind] = useState<CategoryKind>('expense');
	const { data, isLoading } = useCategoriesQuery(kind);
	const showChromeSkeleton = isLoading && !data;

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1>
				<p className="mt-1 text-sm text-muted-foreground">Name the parts of your money life.</p>
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap gap-2" aria-hidden="true">
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-8 w-24 rounded-full" />
				</div>
			) : (
				<div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by kind">
					{KIND_FILTERS.map((item) => {
						const active = kind === item.value;
						return (
							<button
								key={item.value}
								type="button"
								role="tab"
								aria-selected={active}
								onClick={() => setKind(item.value)}
								className={cn(
									'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
									active
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
								)}
								data-testid={`category-filter-${item.value}`}
							>
								{item.label}
							</button>
						);
					})}
				</div>
			)}

			<CategoryKindPanel key={kind} kind={kind} />
		</div>
	);
}
