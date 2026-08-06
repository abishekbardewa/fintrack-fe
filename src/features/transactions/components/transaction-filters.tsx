import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { buildCategoryTree } from '@/features/categories/utils';
import type { TransactionType } from '@/features/transactions/types';
import type { TransactionFilterDraft } from '@/features/transactions/utils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const INITIAL_VISIBLE = 8;
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 100_000;
const AMOUNT_STEP = 500;

interface TransactionFiltersProps {
	value: TransactionFilterDraft;
	onChange: (next: TransactionFilterDraft) => void;
}

type BadgeOption = {
	value: string;
	label: string;
};

function formatAmount(n: number) {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function FilterBadgeGroup({
	options,
	selected,
	onSelect,
	ariaLabel,
}: {
	options: BadgeOption[];
	selected: string;
	onSelect: (value: string) => void;
	ariaLabel: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const needsMore = options.length > INITIAL_VISIBLE;
	const visible = expanded || !needsMore ? options : options.slice(0, INITIAL_VISIBLE);

	return (
		<div className="grid gap-2" role="group" aria-label={ariaLabel}>
			<div className="flex flex-wrap gap-1.5">
				{visible.map((opt) => {
					const isSelected = selected === opt.value;
					return (
						<Badge
							key={opt.value || '__all__'}
							asChild
							variant={isSelected ? 'default' : 'outline'}
							className={cn(
								'cursor-pointer px-2.5 py-1 transition-colors',
								!isSelected && 'hover:bg-accent hover:text-accent-foreground',
							)}
						>
							<button
								type="button"
								aria-pressed={isSelected}
								onClick={() => onSelect(isSelected ? '' : opt.value)}
							>
								{opt.label}
							</button>
						</Badge>
					);
				})}
			</div>
			{needsMore ? (
				<button
					type="button"
					className="w-fit text-xs font-medium text-muted-foreground hover:text-foreground"
					onClick={() => setExpanded((open) => !open)}
				>
					{expanded ? 'Show less' : `Show more (${options.length - INITIAL_VISIBLE})`}
				</button>
			) : null}
		</div>
	);
}

function parseAmountBound(raw: string, fallback: number) {
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
	const kind = value.type || undefined;
	const { data } = useCategoriesQuery(kind);
	const tree = useMemo(
		() => buildCategoryTree(data?.categories ?? []),
		[data?.categories],
	);
	const selectedMain = tree.find((c) => c.id === value.categoryId);
	const subs = selectedMain?.children ?? [];

	const committedRange = useMemo(
		(): [number, number] => [
			parseAmountBound(value.minAmount, AMOUNT_MIN),
			parseAmountBound(value.maxAmount, AMOUNT_MAX),
		],
		[value.minAmount, value.maxAmount],
	);
	const [draftRange, setDraftRange] = useState<[number, number] | null>(null);
	const amountRange = draftRange ?? committedRange;

	const commitAmountRange = (range: [number, number]) => {
		const [min, max] = range;
		onChange({
			...value,
			minAmount: min <= AMOUNT_MIN ? '' : String(min),
			maxAmount: max >= AMOUNT_MAX ? '' : String(max),
		});
		setDraftRange(null);
	};

	const handleTypeChange = (type: string) => {
		onChange({
			...value,
			type: (type as TransactionType | '') || '',
			categoryId: '',
			subcategoryId: '',
		});
	};

	const handleCategoryChange = (categoryId: string) => {
		onChange({
			...value,
			categoryId,
			subcategoryId: '',
		});
	};

	const typeOptions: BadgeOption[] = [
		{ value: 'expense', label: 'Expense' },
		{ value: 'income', label: 'Income' },
	];

	const categoryOptions: BadgeOption[] = tree.map((c) => ({
		value: c.id,
		label: c.name,
	}));

	const subcategoryOptions: BadgeOption[] = subs.map((c) => ({
		value: c.id,
		label: c.name,
	}));

	const currencyOptions: BadgeOption[] = SUPPORTED_CURRENCIES.map((c) => ({
		value: c.code,
		label: c.code,
	}));

	return (
		<aside
			className="w-full shrink-0 lg:sticky lg:top-20 lg:w-64 xl:w-72"
			data-testid="transaction-filters"
		>
			<div className="rounded-xl border border-border bg-card p-4 shadow-xs">
				<div className="grid gap-5">
					<div className="relative min-w-0">
						<Search
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							value={value.q}
							onChange={(e) => onChange({ ...value, q: e.target.value })}
							placeholder="Search…"
							className={cn('h-9 pl-9', value.q && 'pr-9')}
							aria-label="Search transactions"
							data-testid="transaction-search"
						/>
						{value.q ? (
							<button
								type="button"
								className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
								onClick={() => onChange({ ...value, q: '' })}
								aria-label="Clear search"
								data-testid="transaction-search-clear"
							>
								<X className="size-3.5" />
							</button>
						) : null}
					</div>

					<div className="grid gap-2">
						<Label>Type</Label>
						<FilterBadgeGroup
							options={typeOptions}
							selected={value.type}
							onSelect={handleTypeChange}
							ariaLabel="Filter by type"
						/>
					</div>

					{categoryOptions.length > 0 ? (
						<div className="grid gap-2">
							<Label>Category</Label>
							<FilterBadgeGroup
								options={categoryOptions}
								selected={value.categoryId}
								onSelect={handleCategoryChange}
								ariaLabel="Filter by category"
							/>
						</div>
					) : null}

					{value.categoryId && subcategoryOptions.length > 0 ? (
						<div className="grid gap-2">
							<Label>Subcategory</Label>
							<FilterBadgeGroup
								options={subcategoryOptions}
								selected={value.subcategoryId}
								onSelect={(subcategoryId) => onChange({ ...value, subcategoryId })}
								ariaLabel="Filter by subcategory"
							/>
						</div>
					) : null}

					<div className="grid gap-2">
						<Label>Currency</Label>
						<FilterBadgeGroup
							options={currencyOptions}
							selected={value.currency}
							onSelect={(currency) => onChange({ ...value, currency })}
							ariaLabel="Filter by currency"
						/>
					</div>

					<div className="grid gap-2">
						<Label>Date range</Label>
						<div className="grid gap-2">
							<DatePicker
								value={value.from}
								onChange={(from) => onChange({ ...value, from })}
								placeholder="From date"
								aria-label="From date"
							/>
							<DatePicker
								value={value.to}
								onChange={(to) => onChange({ ...value, to })}
								placeholder="To date"
								aria-label="To date"
							/>
						</div>
					</div>

					<div className="grid gap-3">
						<div className="flex items-center justify-between gap-2">
							<Label>Amount</Label>
							<span className="text-xs tabular-nums text-muted-foreground">
								{formatAmount(amountRange[0])} – {formatAmount(amountRange[1])}
								{amountRange[1] >= AMOUNT_MAX ? '+' : ''}
							</span>
						</div>
						<Slider
							min={AMOUNT_MIN}
							max={AMOUNT_MAX}
							step={AMOUNT_STEP}
							value={amountRange}
							onValueChange={(next) => {
								const [min, max] = next;
								setDraftRange([min ?? AMOUNT_MIN, max ?? AMOUNT_MAX]);
							}}
							onValueCommit={(next) => {
								const [min, max] = next;
								commitAmountRange([min ?? AMOUNT_MIN, max ?? AMOUNT_MAX]);
							}}
							aria-label="Filter by amount range"
						/>
					</div>
				</div>
			</div>
		</aside>
	);
}
