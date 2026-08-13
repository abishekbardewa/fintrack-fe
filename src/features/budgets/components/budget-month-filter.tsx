import { useMemo, useState } from 'react';
import { ListFilter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	budgetMonthOptions,
	budgetYearOptions,
	currentMonthParams,
	isCurrentMonth,
	monthName,
} from '@/features/budgets/utils';
import { cn } from '@/lib/utils';

const filterControlClass =
	'h-10 min-h-10 rounded-lg border border-input/20 bg-muted py-0 text-sm font-medium shadow-xs';
const filterActiveClass =
	'border-primary/30 bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground dark:border-primary/30 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary [&_svg]:text-primary-foreground';

interface BudgetMonthFilterProps {
	year: number;
	month: number;
	onChange: (next: { year: number; month: number }) => void;
}

export function BudgetMonthFilter({ year, month, onChange }: BudgetMonthFilterProps) {
	const current = currentMonthParams();
	const [open, setOpen] = useState(false);
	const [draftYear, setDraftYear] = useState(year);
	const [draftMonth, setDraftMonth] = useState(month);

	const yearOptions = budgetYearOptions();
	const monthOptions = useMemo(() => budgetMonthOptions(draftYear), [draftYear]);
	const filterActive = !isCurrentMonth(year, month);
	const draftDirty = draftYear !== year || draftMonth !== month;
	const canClearAll = !isCurrentMonth(draftYear, draftMonth);
	const canApply = draftDirty;

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			setDraftYear(year);
			setDraftMonth(month);
		}
		setOpen(nextOpen);
	};

	const clearDraft = () => {
		setDraftYear(current.year);
		setDraftMonth(current.month);
	};

	const applyFilters = () => {
		onChange({ year: draftYear, month: draftMonth });
		setOpen(false);
	};

	return (
		<>
			<button
				type="button"
				onClick={() => handleOpenChange(true)}
				className={cn(
					'relative inline-flex size-10 items-center justify-center rounded-full border border-input/20 bg-muted shadow-xs transition-colors outline-none',
					'hover:bg-muted/80 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/30',
					filterActive && filterActiveClass,
				)}
				aria-label="Filter by month and year"
				data-testid="budget-month-filter"
			>
				<ListFilter className="size-4" />
			</button>

			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-md" data-testid="budget-filter-dialog">
					<DialogHeader>
						<DialogTitle>Filters</DialogTitle>
						<DialogDescription>Narrow what you see.</DialogDescription>
					</DialogHeader>

					<div className="grid gap-5 py-1">
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-2">
								<Label htmlFor="budget-filter-year">Year</Label>
								<Select
									value={String(draftYear)}
									onValueChange={(value) => {
										const nextYear = Number(value);
										setDraftYear(nextYear);
										const allowed = budgetMonthOptions(nextYear);
										if (!allowed.includes(draftMonth)) {
											setDraftMonth(allowed[allowed.length - 1] ?? 1);
										}
									}}
								>
									<SelectTrigger
										id="budget-filter-year"
										className={filterControlClass}
										data-testid="budget-filter-year"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{yearOptions.map((y) => (
											<SelectItem key={y} value={String(y)}>
												{y}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="budget-filter-month">Month</Label>
								<Select
									value={String(draftMonth)}
									onValueChange={(value) => setDraftMonth(Number(value))}
								>
									<SelectTrigger
										id="budget-filter-month"
										className={filterControlClass}
										data-testid="budget-filter-month"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{monthOptions.map((m) => (
											<SelectItem key={m} value={String(m)}>
												{monthName(m)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<DialogFooter className="gap-3 sm:gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={clearDraft}
							disabled={!canClearAll}
							data-testid="budget-filter-clear"
						>
							Clear all
						</Button>
						<Button
							type="button"
							onClick={applyFilters}
							disabled={!canApply}
							data-testid="budget-filter-apply"
						>
							Apply filter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
