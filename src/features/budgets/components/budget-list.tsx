import { ChartPie, MoreHorizontal, Pencil, Trash2, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import type { Budget } from '@/features/budgets/types';
import {
	displayLimit,
	displayRemaining,
	displaySpent,
	statusLabel,
	statusProgressClass,
} from '@/features/budgets/utils';
import { cn } from '@/lib/utils';

interface BudgetListProps {
	budgets: Budget[];
	preferredCurrency: string;
	categoryNameById: Map<string, string>;
	canManage?: boolean;
	onEdit: (budget: Budget) => void;
	onDelete: (budget: Budget) => void;
}

export function BudgetList({
	budgets,
	preferredCurrency,
	categoryNameById,
	canManage = true,
	onEdit,
	onDelete,
}: BudgetListProps) {
	const sorted = [...budgets].sort((a, b) => {
		if (a.categoryId == null && b.categoryId != null) return -1;
		if (a.categoryId != null && b.categoryId == null) return 1;
		const nameA = a.categoryId ? (categoryNameById.get(a.categoryId) ?? '') : '';
		const nameB = b.categoryId ? (categoryNameById.get(b.categoryId) ?? '') : '';
		return nameA.localeCompare(nameB);
	});

	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="budget-list"
		>
			{sorted.map((budget) => (
				<BudgetCard
					key={budget.id}
					budget={budget}
					preferredCurrency={preferredCurrency}
					title={
						budget.categoryId == null
							? 'All expenses'
							: (categoryNameById.get(budget.categoryId) ?? 'Category')
					}
					canManage={canManage}
					onEdit={() => onEdit(budget)}
					onDelete={() => onDelete(budget)}
				/>
			))}
		</div>
	);
}

interface BudgetCardProps {
	budget: Budget;
	preferredCurrency: string;
	title: string;
	canManage: boolean;
	onEdit: () => void;
	onDelete: () => void;
}

function BudgetCard({
	budget,
	preferredCurrency,
	title,
	canManage,
	onEdit,
	onDelete,
}: BudgetCardProps) {
	const isAllExpenses = budget.categoryId == null;
	const percent = Math.min(100, Math.max(0, budget.percent));

	if (isAllExpenses) {
		return (
			<article
				className="relative flex flex-col overflow-hidden rounded-3xl bg-feature text-feature-foreground shadow-md shadow-feature/25"
				data-testid={`budget-card-${budget.id}`}
			>
				<ChartPie
					className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-feature-foreground/10"
					aria-hidden="true"
					strokeWidth={1.25}
				/>

				<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="truncate text-sm font-medium text-feature-foreground/90">
								{title}
							</h3>
							<FeatureStatusBadge status={budget.status} />
						</div>
					</div>
					{canManage ? (
						<BudgetActions
							onEdit={onEdit}
							onDelete={onDelete}
							triggerClassName="text-feature-foreground/80 hover:bg-feature-foreground/10 hover:text-feature-foreground"
						/>
					) : (
						<span className="size-8 shrink-0" aria-hidden="true" />
					)}
				</div>

				<div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5">
					<div className="flex items-end gap-2">
						<span className="text-4xl font-bold tracking-tight tabular-nums">
							{budget.percent}%
						</span>
						<span className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-feature-foreground/70 uppercase">
							Used
						</span>
					</div>

					<div className="flex items-baseline justify-between gap-2 text-sm">
						<span className="font-semibold tabular-nums">
							{displaySpent(budget, preferredCurrency)}
						</span>
						<span className="tabular-nums text-feature-foreground/70">
							of {displayLimit(budget, preferredCurrency)}
						</span>
					</div>

					<Progress
						value={percent}
						className={cn(
							'bg-feature-foreground/20',
							budget.status === 'over' && 'bg-white/15',
						)}
						indicatorClassName={cn(
							'bg-feature-foreground',
							budget.status === 'warning' && 'bg-amber-300',
							budget.status === 'over' && 'bg-red-300',
						)}
						aria-label={`${percent}% of budget used`}
					/>

					<div className="flex justify-end text-xs text-feature-foreground/70">
						<span className="tabular-nums">{displayRemaining(budget)} left</span>
					</div>
				</div>
			</article>
		);
	}

	const trackClass =
		budget.status === 'over'
			? 'bg-expense/20'
			: budget.status === 'warning'
				? 'bg-amber-500/20'
				: 'bg-primary/20';

	return (
		<article
			className="relative flex flex-col overflow-hidden rounded-3xl bg-muted shadow-sm"
			data-testid={`budget-card-${budget.id}`}
		>
			<Wallet
				className="pointer-events-none absolute -right-4 -bottom-4 size-36 rotate-12 text-primary/[0.03]"
				aria-hidden="true"
				strokeWidth={1.25}
			/>

			<div className="relative z-10 flex items-start gap-3 px-5 pt-5 pb-3">
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
						<StatusBadge status={budget.status} />
					</div>
				</div>
				{canManage ? (
					<BudgetActions onEdit={onEdit} onDelete={onDelete} />
				) : (
					<span className="size-8 shrink-0" aria-hidden="true" />
				)}
			</div>

			<div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5">
				<div className="flex items-end gap-2">
					<span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
						{budget.percent}%
					</span>
					<span className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
						Used
					</span>
				</div>

				<div className="flex items-baseline justify-between gap-2 text-sm">
					<span className="font-semibold tabular-nums text-foreground">
						{displaySpent(budget, preferredCurrency)}
					</span>
					<span className="text-muted-foreground tabular-nums">
						of {displayLimit(budget, preferredCurrency)}
					</span>
				</div>

				<Progress
					value={percent}
					className={trackClass}
					indicatorClassName={statusProgressClass(budget.status)}
					aria-label={`${percent}% of budget used`}
				/>

				<div className="flex justify-end text-xs text-muted-foreground">
					<span className="tabular-nums">{displayRemaining(budget)} left</span>
				</div>
			</div>
		</article>
	);
}

function BudgetActions({
	onEdit,
	onDelete,
	triggerClassName,
}: {
	onEdit: () => void;
	onDelete: () => void;
	triggerClassName?: string;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label="Budget actions"
					className={triggerClassName}
				>
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={onEdit}>
					<Pencil />
					Edit limit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function StatusBadge({ status }: { status: Budget['status'] }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'font-medium',
				status === 'ok' && 'border-primary/30 bg-primary/10 text-primary',
				status === 'warning' &&
					'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
				status === 'over' && 'border-expense/30 bg-expense/10 text-expense',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}

function FeatureStatusBadge({ status }: { status: Budget['status'] }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'border-feature-foreground/25 bg-feature-foreground/10 font-medium text-feature-foreground',
				status === 'warning' && 'border-amber-300/40 bg-amber-300/15 text-amber-100',
				status === 'over' && 'border-red-300/40 bg-red-300/15 text-red-100',
			)}
		>
			{statusLabel(status)}
		</Badge>
	);
}
