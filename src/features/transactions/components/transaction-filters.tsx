import { useMemo, useState } from 'react';
import { ListFilter, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { buildCategoryTree } from '@/features/categories/utils';
import type { TransactionType } from '@/features/transactions/types';
import {
	formatDateInput,
	type TransactionFilterDraft,
} from '@/features/transactions/utils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

const AMOUNT_MIN = 0;
const AMOUNT_MAX = 100_000;
const AMOUNT_STEP = 500;
const TYPE_OPTIONS: { value: TransactionType | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'expense', label: 'Expense' },
	{ value: 'income', label: 'Income' },
];

const filterControlClass =
	'h-10 min-h-10 rounded-lg border border-input/20 bg-muted py-0 text-sm font-medium shadow-xs';
const filterActiveClass =
	'border-primary/30 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:border-primary/30 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary [&_svg]:text-primary-foreground';

type MoreFilterDraft = Pick<
	TransactionFilterDraft,
	'from' | 'to' | 'currency' | 'minAmount' | 'maxAmount'
>;

const EMPTY_MORE: MoreFilterDraft = {
	from: '',
	to: '',
	currency: '',
	minAmount: '',
	maxAmount: '',
};

interface TransactionFiltersProps {
	value: TransactionFilterDraft;
	onChange: (next: TransactionFilterDraft) => void;
}

function formatAmount(n: number) {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}

function parseAmountBound(raw: string, fallback: number) {
	if (!raw) return fallback;
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

function pickMoreFilters(value: TransactionFilterDraft): MoreFilterDraft {
	return {
		from: value.from,
		to: value.to,
		currency: value.currency,
		minAmount: value.minAmount,
		maxAmount: value.maxAmount,
	};
}

function moreFiltersEqual(a: MoreFilterDraft, b: MoreFilterDraft) {
	return (
		a.from === b.from &&
		a.to === b.to &&
		a.currency === b.currency &&
		a.minAmount === b.minAmount &&
		a.maxAmount === b.maxAmount
	);
}

function hasMoreFilters(draft: MoreFilterDraft) {
	return Boolean(
		draft.from || draft.to || draft.currency || draft.minAmount || draft.maxAmount,
	);
}

function countMoreFilters(draft: MoreFilterDraft) {
	return [draft.from || draft.to, draft.currency, draft.minAmount || draft.maxAmount].filter(
		Boolean,
	).length;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
	const [moreOpen, setMoreOpen] = useState(false);
	const [moreDraft, setMoreDraft] = useState<MoreFilterDraft>(EMPTY_MORE);
	const [amountDragging, setAmountDragging] = useState<[number, number] | null>(null);

	const kind = value.type || undefined;
	const { data } = useCategoriesQuery(kind);
	const tree = useMemo(
		() => buildCategoryTree(data?.categories ?? []),
		[data?.categories],
	);
	const selectedMain = tree.find((c) => c.id === value.categoryId);
	const subs = selectedMain?.children ?? [];

	const appliedMore = useMemo(() => pickMoreFilters(value), [value]);
	const moreActive = hasMoreFilters(appliedMore);
	const moreCount = countMoreFilters(appliedMore);
	const typeActive = Boolean(value.type);
	const categoryActive = Boolean(value.categoryId);
	const subcategoryActive = Boolean(value.subcategoryId);
	const searchActive = Boolean(value.q.trim());

	const amountRange = useMemo((): [number, number] => {
		if (amountDragging) return amountDragging;
		return [
			parseAmountBound(moreDraft.minAmount, AMOUNT_MIN),
			parseAmountBound(moreDraft.maxAmount, AMOUNT_MAX),
		];
	}, [amountDragging, moreDraft.minAmount, moreDraft.maxAmount]);

	const effectiveMoreDraft = useMemo((): MoreFilterDraft => {
		if (!amountDragging) return moreDraft;
		const [min, max] = amountDragging;
		return {
			...moreDraft,
			minAmount: min <= AMOUNT_MIN ? '' : String(min),
			maxAmount: max >= AMOUNT_MAX ? '' : String(max),
		};
	}, [amountDragging, moreDraft]);

	const draftDirty = !moreFiltersEqual(effectiveMoreDraft, appliedMore);
	const canClearAll = hasMoreFilters(effectiveMoreDraft);
	const canApply = draftDirty;

	const handleTypeChange = (type: string) => {
		onChange({
			...value,
			type: (type === '__all__' ? '' : type) as TransactionType | '',
			categoryId: '',
			subcategoryId: '',
		});
	};

	const handleMoreOpenChange = (open: boolean) => {
		if (open) {
			setMoreDraft(pickMoreFilters(value));
			setAmountDragging(null);
		} else {
			setAmountDragging(null);
		}
		setMoreOpen(open);
	};

	const clearMoreDraft = () => {
		setMoreDraft(EMPTY_MORE);
		setAmountDragging(null);
	};

	const applyMoreFilters = () => {
		onChange({
			...value,
			...effectiveMoreDraft,
		});
		setAmountDragging(null);
		setMoreOpen(false);
	};

	const removeDateFilter = () => {
		onChange({ ...value, from: '', to: '' });
	};

	const removeCurrencyFilter = () => {
		onChange({ ...value, currency: '' });
	};

	const removeAmountFilter = () => {
		onChange({ ...value, minAmount: '', maxAmount: '' });
	};

	const dateChipLabel =
		value.from || value.to
			? `${value.from ? formatDateInput(value.from) : '…'} – ${
					value.to ? formatDateInput(value.to) : '…'
				}`
			: null;

	const amountChipLabel =
		value.minAmount || value.maxAmount
			? `${formatAmount(parseAmountBound(value.minAmount, AMOUNT_MIN))} – ${formatAmount(
					parseAmountBound(value.maxAmount, AMOUNT_MAX),
				)}${!value.maxAmount || Number(value.maxAmount) >= AMOUNT_MAX ? '+' : ''}`
			: null;

	return (
		<div className="flex flex-col gap-3" data-testid="transaction-filters">
		<div
			className="flex flex-wrap items-center gap-2"
			role="search"
			aria-label="Transaction filters"
		>
			<Select value={value.type || '__all__'} onValueChange={handleTypeChange}>
				<SelectTrigger
					className={cn('min-w-28', filterControlClass, typeActive && filterActiveClass)}
					aria-label="Type"
					data-testid="transaction-filter-type"
				>
					<SelectValue placeholder="Type" />
				</SelectTrigger>
				<SelectContent>
					{TYPE_OPTIONS.map((opt) => (
						<SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={value.categoryId || '__all__'}
				onValueChange={(categoryId) =>
					onChange({
						...value,
						categoryId: categoryId === '__all__' ? '' : categoryId,
						subcategoryId: '',
					})
				}
			>
				<SelectTrigger
					className={cn('min-w-36', filterControlClass, categoryActive && filterActiveClass)}
					aria-label="Category"
				>
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

			<Select
				value={value.subcategoryId || '__all__'}
				onValueChange={(subcategoryId) =>
					onChange({
						...value,
						subcategoryId: subcategoryId === '__all__' ? '' : subcategoryId,
					})
				}
				disabled={!value.categoryId || subs.length === 0}
			>
				<SelectTrigger
					className={cn(
						'min-w-36',
						filterControlClass,
						subcategoryActive && filterActiveClass,
					)}
					aria-label="Subcategory"
				>
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

			<button
				type="button"
				onClick={() => handleMoreOpenChange(true)}
				className={cn(
					'relative inline-flex size-10 items-center justify-center rounded-lg border border-input/20 bg-muted shadow-xs transition-colors outline-none',
					'hover:bg-muted/80 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/30',
					moreActive && filterActiveClass,
				)}
				aria-label="More filters"
				data-testid="transaction-filter-more"
			>
				<ListFilter className="size-4" />
				{moreCount > 0 ? (
					<span
						className={cn(
							'absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold',
							moreActive
								? 'bg-primary-foreground text-primary'
								: 'bg-primary text-primary-foreground',
						)}
					>
						{moreCount}
					</span>
				) : null}
			</button>

			<div className="relative min-w-48 flex-1 sm:ml-auto sm:max-w-64">
				<Search
					className={cn(
						'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2',
						searchActive ? 'text-primary-foreground/80' : 'text-muted-foreground',
					)}
					aria-hidden="true"
				/>
				<Input
					value={value.q}
					onChange={(e) => onChange({ ...value, q: e.target.value })}
					placeholder="Search"
					className={cn(
						'h-10 min-h-10 rounded-lg py-0 pl-9',
						value.q && 'pr-9',
						searchActive && filterActiveClass,
						searchActive && 'placeholder:text-primary-foreground/70',
					)}
					aria-label="Search transactions"
					data-testid="transaction-search"
				/>
				{value.q ? (
					<button
						type="button"
						className={cn(
							'absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm',
							searchActive
								? 'text-primary-foreground/80 hover:text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground',
						)}
						onClick={() => onChange({ ...value, q: '' })}
						aria-label="Clear search"
						data-testid="transaction-search-clear"
					>
						<X className="size-3.5" />
					</button>
				) : null}
			</div>
		</div>

			{moreActive ? (
				<div
					className="flex flex-wrap items-center gap-2"
					data-testid="transaction-applied-filters"
					aria-label="Applied filters"
				>
					{dateChipLabel ? (
						<AppliedFilterChip
							label={dateChipLabel}
							onRemove={removeDateFilter}
							testId="transaction-applied-date"
						/>
					) : null}
					{value.currency ? (
						<AppliedFilterChip
							label={value.currency}
							onRemove={removeCurrencyFilter}
							testId="transaction-applied-currency"
						/>
					) : null}
					{amountChipLabel ? (
						<AppliedFilterChip
							label={amountChipLabel}
							onRemove={removeAmountFilter}
							testId="transaction-applied-amount"
						/>
					) : null}
				</div>
			) : null}

			<Dialog open={moreOpen} onOpenChange={handleMoreOpenChange}>
				<DialogContent className="sm:max-w-md" data-testid="transaction-filter-more-dialog">
					<DialogHeader>
						<DialogTitle>Filters</DialogTitle>
						<DialogDescription>Narrow what you see.</DialogDescription>
					</DialogHeader>

					<div className="grid gap-5 py-1">
						<div className="grid gap-2">
							<Label>Date range</Label>
							<DateRangePicker
								from={moreDraft.from}
								to={moreDraft.to}
								onChange={({ from, to }) => setMoreDraft((prev) => ({ ...prev, from, to }))}
								placeholder="Date range"
								className="w-full"
							/>
						</div>

						<div className="grid gap-2">
							<Label>Currency</Label>
							<div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by currency">
								{SUPPORTED_CURRENCIES.map((c) => {
									const selected = moreDraft.currency === c.code;
									return (
										<Badge
											key={c.code}
											asChild
											variant={selected ? 'default' : 'outline'}
											className={cn(
												'cursor-pointer px-2.5 py-1 transition-colors',
												!selected && 'hover:bg-accent hover:text-accent-foreground',
											)}
										>
											<button
												type="button"
												aria-pressed={selected}
												onClick={() =>
													setMoreDraft((prev) => ({
														...prev,
														currency: selected ? '' : c.code,
													}))
												}
											>
												{c.code}
											</button>
										</Badge>
									);
								})}
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
									setAmountDragging([min ?? AMOUNT_MIN, max ?? AMOUNT_MAX]);
								}}
								onValueCommit={(next) => {
									const [min, max] = next;
									const nextMin = min ?? AMOUNT_MIN;
									const nextMax = max ?? AMOUNT_MAX;
									setMoreDraft((prev) => ({
										...prev,
										minAmount: nextMin <= AMOUNT_MIN ? '' : String(nextMin),
										maxAmount: nextMax >= AMOUNT_MAX ? '' : String(nextMax),
									}));
									setAmountDragging(null);
								}}
								aria-label="Filter by amount range"
							/>
						</div>
					</div>

					<DialogFooter className="gap-3 sm:gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={clearMoreDraft}
							disabled={!canClearAll}
							data-testid="transaction-filter-more-clear"
						>
							Clear all
						</Button>
						<Button
							type="button"
							onClick={applyMoreFilters}
							disabled={!canApply}
							data-testid="transaction-filter-more-apply"
						>
							Apply filter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function AppliedFilterChip({
	label,
	onRemove,
	testId,
}: {
	label: string;
	onRemove: () => void;
	testId: string;
}) {
	return (
		<span
			className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 text-sm text-primary"
			data-testid={testId}
		>
			<span className="max-w-56 truncate">{label}</span>
			<button
				type="button"
				onClick={onRemove}
				className="inline-flex size-5 items-center justify-center rounded-full text-primary/80 transition-colors hover:bg-primary/15 hover:text-primary"
				aria-label={`Remove ${label}`}
			>
				<X className="size-3.5" />
			</button>
		</span>
	);
}
