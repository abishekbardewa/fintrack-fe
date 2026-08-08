import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ListFilter, Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { BudgetDeleteDialog } from '@/features/budgets/components/budget-delete-dialog';
import { BudgetFormDialog } from '@/features/budgets/components/budget-form-dialog';
import { BudgetList } from '@/features/budgets/components/budget-list';
import {
	useBudgetsQuery,
	useDeleteBudgetMutation,
	useUpsertBudgetMutation,
} from '@/features/budgets/hooks/use-budgets';
import type { Budget, UpsertBudgetRequest } from '@/features/budgets/types';
import {
	budgetMonthOptions,
	budgetYearOptions,
	canGoNextMonth,
	canGoPrevMonth,
	currentMonthParams,
	isCurrentMonth,
	monthLabel,
	monthName,
	shiftMonth,
} from '@/features/budgets/utils';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';

export function BudgetsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const current = currentMonthParams();
	const [year, setYear] = useState(current.year);
	const [month, setMonth] = useState(current.month);
	const [filterOpen, setFilterOpen] = useState(false);

	const listParams = { periodType: 'month' as const, year, month };
	const currentListParams = {
		periodType: 'month' as const,
		year: current.year,
		month: current.month,
	};

	const { data, isLoading, isError, refetch } = useBudgetsQuery(listParams);
	const { data: currentMonthData } = useBudgetsQuery(currentListParams);
	const { data: categoriesData } = useCategoriesQuery('expense');
	const upsertMutation = useUpsertBudgetMutation();
	const deleteMutation = useDeleteBudgetMutation();

	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<Budget | null>(null);
	const [deleting, setDeleting] = useState<Budget | null>(null);

	const budgets = data?.budgets ?? [];
	const currentMonthBudgets = currentMonthData?.budgets ?? [];
	const expenseCategories = categoriesData?.categories ?? [];
	const mainExpenseCategories = useMemo(
		() => expenseCategories.filter((c) => c.parentCategoryId == null),
		[expenseCategories],
	);

	const categoryNameById = useMemo(() => {
		const map = new Map<string, string>();
		for (const category of expenseCategories) {
			if (category.parentCategoryId == null) {
				map.set(category.id, category.name);
			}
		}
		return map;
	}, [expenseCategories]);

	const currentMonthExistingIds = useMemo(() => {
		const set = new Set<string | null>();
		for (const budget of currentMonthBudgets) {
			set.add(budget.categoryId);
		}
		return set;
	}, [currentMonthBudgets]);

	const viewingCurrentMonth = isCurrentMonth(year, month);
	const canManageBudgets = viewingCurrentMonth;
	const periodFullyBooked =
		currentMonthExistingIds.has(null) &&
		(mainExpenseCategories.length === 0 ||
			mainExpenseCategories.every((c) => currentMonthExistingIds.has(c.id)));

	const periodLabel = monthLabel(year, month);
	const currentPeriodLabel = monthLabel(current.year, current.month);
	const yearOptions = budgetYearOptions();
	const monthOptions = budgetMonthOptions(year);

	const goPrevMonth = () => {
		if (!canGoPrevMonth(year, month)) return;
		const next = shiftMonth(year, month, -1);
		setYear(next.year);
		setMonth(next.month);
	};

	const goNextMonth = () => {
		if (!canGoNextMonth(year, month)) return;
		const next = shiftMonth(year, month, 1);
		setYear(next.year);
		setMonth(next.month);
	};

	const goToCurrentMonth = () => {
		setYear(current.year);
		setMonth(current.month);
	};

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (budget: Budget) => {
		if (!canManageBudgets) return;
		setEditing(budget);
		setFormOpen(true);
	};

	const handleFormSubmit = async (payload: UpsertBudgetRequest) => {
		try {
			await upsertMutation.mutateAsync(payload);
			toast.success(editing ? 'Budget updated' : 'Budget saved');
			setFormOpen(false);
			setEditing(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save budget.'));
		}
	};

	const handleDelete = async () => {
		if (!deleting) return;
		try {
			await deleteMutation.mutateAsync(deleting.id);
			toast.success('Budget deleted');
			setDeleting(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete budget.'));
		}
	};

	const deletingLabel =
		deleting?.categoryId == null
			? 'All expenses'
			: (categoryNameById.get(deleting.categoryId) ?? 'Category');

	const formYear = current.year;
	const formMonth = current.month;
	const formPeriodLabel = currentPeriodLabel;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Budgets</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Limit monthly spend.
					</p>
				</div>
				<Button
					type="button"
					onClick={openCreate}
					disabled={periodFullyBooked}
					data-testid="budget-add"
				>
					<Plus className="size-4" />
					Add budget
				</Button>
			</header>

			<div className="flex flex-wrap items-center justify-end gap-3">
				{!viewingCurrentMonth ? (
					<button
						type="button"
						className="text-sm font-medium text-primary underline-offset-4 hover:underline"
						onClick={goToCurrentMonth}
						data-testid="budget-this-month"
					>
						This month
					</button>
				) : null}

				<div className="flex items-center gap-1">
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={goPrevMonth}
						disabled={!canGoPrevMonth(year, month)}
						aria-label="Previous month"
						data-testid="budget-prev-month"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<p className="min-w-32 px-1 text-center text-sm font-semibold tracking-tight tabular-nums">
						{periodLabel}
					</p>
					<Button
						type="button"
						variant="outline"
						size="icon-sm"
						onClick={goNextMonth}
						disabled={!canGoNextMonth(year, month)}
						aria-label="Next month"
						data-testid="budget-next-month"
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>

				<Popover open={filterOpen} onOpenChange={setFilterOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							aria-label="Filter by month and year"
							data-testid="budget-month-filter"
						>
							<ListFilter className="size-4" />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-72 space-y-3 p-4">
						<p className="text-sm font-medium">Jump to month</p>
						<div className="grid grid-cols-2 gap-3">
							<div className="grid gap-1.5">
								<Label htmlFor="budget-filter-year">Year</Label>
								<Select
									value={String(year)}
									onValueChange={(value) => {
										const nextYear = Number(value);
										setYear(nextYear);
										const allowed = budgetMonthOptions(nextYear);
										if (!allowed.includes(month)) {
											setMonth(allowed[allowed.length - 1] ?? 1);
										}
									}}
								>
									<SelectTrigger id="budget-filter-year" data-testid="budget-filter-year">
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
							<div className="grid gap-1.5">
								<Label htmlFor="budget-filter-month">Month</Label>
								<Select
									value={String(month)}
									onValueChange={(value) => setMonth(Number(value))}
								>
									<SelectTrigger id="budget-filter-month" data-testid="budget-filter-month">
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
					</PopoverContent>
				</Popover>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
					<Skeleton className="h-40 rounded-2xl" />
					<Skeleton className="h-40 rounded-2xl" />
					<Skeleton className="h-40 rounded-2xl" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title="Could not load budgets"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{!isLoading && !isError && budgets.length === 0 ? (
				<EmptyState
					icon={Wallet}
					title={`No budgets for ${periodLabel}`}
					description="No budgets were set for this month."
				/>
			) : null}

			{!isLoading && !isError && budgets.length > 0 ? (
				<BudgetList
					budgets={budgets}
					preferredCurrency={preferredCurrency}
					categoryNameById={categoryNameById}
					canManage={canManageBudgets}
					onEdit={openEdit}
					onDelete={setDeleting}
				/>
			) : null}

			<BudgetFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					setFormOpen(open);
					if (!open) setEditing(null);
				}}
				budget={editing}
				periodLabel={formPeriodLabel}
				year={formYear}
				month={formMonth}
				preferredCurrency={preferredCurrency}
				expenseCategories={mainExpenseCategories}
				existingCategoryIds={currentMonthExistingIds}
				pending={upsertMutation.isPending}
				onSubmit={handleFormSubmit}
			/>

			<BudgetDeleteDialog
				open={deleting != null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				budgetLabel={deletingLabel}
				pending={deleteMutation.isPending}
				onConfirm={() => void handleDelete()}
			/>
		</div>
	);
}
