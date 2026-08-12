import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { BudgetDeleteDialog } from '@/features/budgets/components/budget-delete-dialog';
import { BudgetFormDialog } from '@/features/budgets/components/budget-form-dialog';
import { BudgetList } from '@/features/budgets/components/budget-list';
import { BudgetMonthFilter } from '@/features/budgets/components/budget-month-filter';
import {
	useBudgetsQuery,
	useDeleteBudgetMutation,
	useUpsertBudgetMutation,
} from '@/features/budgets/hooks/use-budgets';
import type { Budget, UpsertBudgetRequest } from '@/features/budgets/types';
import {
	canGoNextMonth,
	canGoPrevMonth,
	currentMonthParams,
	isCurrentMonth,
	monthLabel,
	shiftMonth,
} from '@/features/budgets/utils';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY } from '@/lib/currencies';

const monthNavBtnClass =
	'inline-flex size-10 items-center justify-center rounded-full border border-input/20 bg-muted shadow-xs transition-colors outline-none hover:bg-muted/80 focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50';

export function BudgetsPage() {
	const user = useAppSelector(selectUser);
	const preferredCurrency = user?.currency || DEFAULT_CURRENCY;

	const current = currentMonthParams();
	const [year, setYear] = useState(current.year);
	const [month, setMonth] = useState(current.month);

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
	const showChromeSkeleton = isLoading && !data;

	return (
		<div className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Budgets</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Decide your limits before you overspend.
					</p>
				</div>
				{showChromeSkeleton ? (
					<Skeleton className="h-9 w-32 rounded-full" />
				) : (
					<Button
						type="button"
						onClick={openCreate}
						disabled={periodFullyBooked}
						data-testid="budget-add"
					>
						<Plus className="size-4" />
						Add budget
					</Button>
				)}
			</header>

			{showChromeSkeleton ? (
				<div className="flex flex-wrap items-center justify-end gap-3" aria-hidden="true">
					<Skeleton className="size-10 rounded-full" />
					<Skeleton className="h-5 w-32 rounded-full" />
					<Skeleton className="size-10 rounded-full" />
					<Skeleton className="h-10 w-28 rounded-full" />
				</div>
			) : (
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

					<div className="flex items-center gap-2">
						<button
							type="button"
							className={monthNavBtnClass}
							onClick={goPrevMonth}
							disabled={!canGoPrevMonth(year, month)}
							aria-label="Previous month"
							data-testid="budget-prev-month"
						>
							<ChevronLeft className="size-4" />
						</button>
						<p className="min-w-32 px-1 text-center text-sm font-semibold tracking-tight tabular-nums">
							{periodLabel}
						</p>
						<button
							type="button"
							className={monthNavBtnClass}
							onClick={goNextMonth}
							disabled={!canGoNextMonth(year, month)}
							aria-label="Next month"
							data-testid="budget-next-month"
						>
							<ChevronRight className="size-4" />
						</button>
					</div>

					<BudgetMonthFilter
						year={year}
						month={month}
						onChange={({ year: nextYear, month: nextMonth }) => {
							setYear(nextYear);
							setMonth(nextMonth);
						}}
					/>
				</div>
			)}

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
