import { useMemo, useState } from 'react';
import { ListFilter, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { buildCategoryTree } from '@/features/categories/utils';
import type { TransactionType } from '@/features/transactions/types';
import {
	EMPTY_FILTERS,
	hasActiveFilters,
	type TransactionFilterDraft,
} from '@/features/transactions/utils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface TransactionFiltersProps {
	value: TransactionFilterDraft;
	onChange: (next: TransactionFilterDraft) => void;
	categoryLabels: Map<string, string>;
}

type FilterChip = {
	key: string;
	label: string;
	clear: Partial<TransactionFilterDraft>;
};

function advancedFilterCount(value: TransactionFilterDraft) {
	let count = 0;
	if (value.subcategoryId) count += 1;
	if (value.currency) count += 1;
	if (value.from || value.to) count += 1;
	if (value.minAmount || value.maxAmount) count += 1;
	return count;
}

export function TransactionFilters({
	value,
	onChange,
	categoryLabels,
}: TransactionFiltersProps) {
	const [moreOpen, setMoreOpen] = useState(false);
	const kind = value.type || undefined;
	const { data } = useCategoriesQuery(kind);
	const tree = useMemo(
		() => buildCategoryTree(data?.categories ?? []),
		[data?.categories],
	);
	const selectedMain = tree.find((c) => c.id === value.categoryId);
	const subs = selectedMain?.children ?? [];
	const moreCount = advancedFilterCount(value);

	const set = <K extends keyof TransactionFilterDraft>(key: K, next: TransactionFilterDraft[K]) => {
		onChange({ ...value, [key]: next });
	};

	const handleTypeChange = (type: TransactionType | '') => {
		onChange({
			...value,
			type,
			categoryId: '',
			subcategoryId: '',
		});
	};

	const handleCategoryChange = (categoryId: string) => {
		onChange({
			...value,
			categoryId: categoryId === '__all__' ? '' : categoryId,
			subcategoryId: '',
		});
	};

	const chips: FilterChip[] = [];
	if (value.type) {
		chips.push({
			key: 'type',
			label: value.type === 'expense' ? 'Expense' : 'Income',
			clear: { type: '', categoryId: '', subcategoryId: '' },
		});
	}
	if (value.categoryId) {
		chips.push({
			key: 'categoryId',
			label: categoryLabels.get(value.categoryId) ?? 'Category',
			clear: { categoryId: '', subcategoryId: '' },
		});
	}
	if (value.subcategoryId) {
		chips.push({
			key: 'subcategoryId',
			label: categoryLabels.get(value.subcategoryId) ?? 'Subcategory',
			clear: { subcategoryId: '' },
		});
	}
	if (value.currency) {
		chips.push({
			key: 'currency',
			label: value.currency,
			clear: { currency: '' },
		});
	}
	if (value.from || value.to) {
		chips.push({
			key: 'dates',
			label: `${value.from || '…'} → ${value.to || '…'}`,
			clear: { from: '', to: '' },
		});
	}
	if (value.minAmount || value.maxAmount) {
		chips.push({
			key: 'amount',
			label: `${value.minAmount || '0'}–${value.maxAmount || '∞'}`,
			clear: { minAmount: '', maxAmount: '' },
		});
	}

	return (
		<div className="grid gap-2">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<div className="relative min-w-0 flex-1">
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						value={value.q}
						onChange={(e) => set('q', e.target.value)}
						placeholder="Search transactions…"
						className="h-9 pl-9"
						aria-label="Search transactions"
						data-testid="transaction-search"
					/>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={value.type || '__all__'}
						onValueChange={(v) => handleTypeChange(v === '__all__' ? '' : (v as TransactionType))}
					>
						<SelectTrigger className="h-9 w-[8.5rem]" aria-label="Filter by type">
							<SelectValue placeholder="All types" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All types</SelectItem>
							<SelectItem value="expense">Expense</SelectItem>
							<SelectItem value="income">Income</SelectItem>
						</SelectContent>
					</Select>

					<Select value={value.categoryId || '__all__'} onValueChange={handleCategoryChange}>
						<SelectTrigger className="h-9 w-[10rem]" aria-label="Filter by category">
							<SelectValue placeholder="Category" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All categories</SelectItem>
							{tree.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Button
						type="button"
						variant={moreOpen || moreCount > 0 ? 'secondary' : 'outline'}
						size="sm"
						className="h-9 gap-1.5"
						onClick={() => setMoreOpen((open) => !open)}
						aria-expanded={moreOpen}
						data-testid="transaction-filters-more"
					>
						<ListFilter className="size-4" />
						Filters
						{moreCount > 0 ? (
							<span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
								{moreCount}
							</span>
						) : null}
					</Button>
				</div>
			</div>

			{moreOpen ? (
				<div className="grid gap-2 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-3">
					<Select
						value={value.subcategoryId || '__all__'}
						onValueChange={(v) => set('subcategoryId', v === '__all__' ? '' : v)}
						disabled={!value.categoryId || subs.length === 0}
					>
						<SelectTrigger className="h-9 w-full" aria-label="Filter by subcategory">
							<SelectValue placeholder="Subcategory" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All subcategories</SelectItem>
							{subs.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={value.currency || '__all__'}
						onValueChange={(v) => set('currency', v === '__all__' ? '' : v)}
					>
						<SelectTrigger className="h-9 w-full" aria-label="Filter by currency">
							<SelectValue placeholder="Currency" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="__all__">All currencies</SelectItem>
							{SUPPORTED_CURRENCIES.map((c) => (
								<SelectItem key={c.code} value={c.code}>
									{c.code}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1">
						<DatePicker
							value={value.from}
							onChange={(v) => set('from', v)}
							placeholder="From date"
							aria-label="From date"
						/>
						<DatePicker
							value={value.to}
							onChange={(v) => set('to', v)}
							placeholder="To date"
							aria-label="To date"
						/>
					</div>

					<Input
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={value.minAmount}
						onChange={(e) => set('minAmount', e.target.value)}
						placeholder="Min amount"
						className="h-9 tabular-nums"
						aria-label="Minimum amount"
					/>
					<Input
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={value.maxAmount}
						onChange={(e) => set('maxAmount', e.target.value)}
						placeholder="Max amount"
						className="h-9 tabular-nums"
						aria-label="Maximum amount"
					/>
				</div>
			) : null}

			{chips.length > 0 ? (
				<div className="flex flex-wrap items-center gap-1.5">
					{chips.map((chip) => (
						<button
							key={chip.key}
							type="button"
							onClick={() => onChange({ ...value, ...chip.clear })}
							className={cn(
								'inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground',
							)}
						>
							{chip.label}
							<X className="size-3 text-muted-foreground" aria-hidden="true" />
							<span className="sr-only">Remove filter</span>
						</button>
					))}
					{hasActiveFilters(value) ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-6 px-2 text-xs text-muted-foreground"
							onClick={() => onChange(EMPTY_FILTERS)}
							data-testid="transaction-filters-clear"
						>
							Clear
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	);
}
