import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import {
	budgetFieldErrors,
	budgetFormSchema,
	OVERALL_BUDGET_VALUE,
	type BudgetFormValues,
} from '@/features/budgets/schemas';
import type { Budget, UpsertBudgetRequest } from '@/features/budgets/types';
import type { Category } from '@/features/categories/types';

interface BudgetFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	budget?: Budget | null;
	periodLabel: string;
	year: number;
	month: number;
	preferredCurrency: string;
	expenseCategories: Category[];
	existingCategoryIds: Set<string | null>;
	pending?: boolean;
	onSubmit: (payload: UpsertBudgetRequest) => Promise<void> | void;
}

export function BudgetFormDialog({
	open,
	onOpenChange,
	budget,
	periodLabel,
	year,
	month,
	preferredCurrency,
	expenseCategories,
	existingCategoryIds,
	pending = false,
	onSubmit,
}: BudgetFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<BudgetFormFields
						key={budget?.id ?? 'create'}
						budget={budget}
						periodLabel={periodLabel}
						year={year}
						month={month}
						preferredCurrency={preferredCurrency}
						expenseCategories={expenseCategories}
						existingCategoryIds={existingCategoryIds}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface BudgetFormFieldsProps {
	budget?: Budget | null;
	periodLabel: string;
	year: number;
	month: number;
	preferredCurrency: string;
	expenseCategories: Category[];
	existingCategoryIds: Set<string | null>;
	pending: boolean;
	onCancel: () => void;
	onSubmit: BudgetFormDialogProps['onSubmit'];
}

function BudgetFormFields({
	budget,
	periodLabel,
	year,
	month,
	preferredCurrency,
	expenseCategories,
	existingCategoryIds,
	pending,
	onCancel,
	onSubmit,
}: BudgetFormFieldsProps) {
	const isEdit = budget != null;

	const availableOptions = useMemo(() => {
		if (isEdit) {
			const label =
				budget?.categoryId == null
					? 'All expenses'
					: (expenseCategories.find((c) => c.id === budget.categoryId)?.name ?? 'Category');
			return [
				{
					value: budget?.categoryId ?? OVERALL_BUDGET_VALUE,
					label,
				},
			];
		}

		const options: { value: string; label: string }[] = [];
		if (!existingCategoryIds.has(null)) {
			options.push({ value: OVERALL_BUDGET_VALUE, label: 'All expenses' });
		}

		const mains = expenseCategories
			.filter((c) => c.parentCategoryId == null)
			.sort((a, b) => a.name.localeCompare(b.name));

		for (const main of mains) {
			if (!existingCategoryIds.has(main.id)) {
				options.push({ value: main.id, label: main.name });
			}
		}

		return options;
	}, [expenseCategories, existingCategoryIds, isEdit, budget?.categoryId]);

	const [values, setValues] = useState<BudgetFormValues>(() => ({
		target: budget
			? (budget.categoryId ?? OVERALL_BUDGET_VALUE)
			: (availableOptions[0]?.value ?? ''),
		limitAmount: budget ? String(budget.limitAmount) : '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormValues, string>>>({});

	const setField = <K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = budgetFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = budgetFormSchema.parse(values);
		const categoryId =
			parsed.target === OVERALL_BUDGET_VALUE ? null : parsed.target;

		await onSubmit({
			periodType: 'month',
			categoryId,
			year,
			month,
			limitAmount: Number(parsed.limitAmount),
			...(isEdit ? {} : { currency: preferredCurrency }),
		});
	};

	const editLabel =
		budget?.categoryId == null
			? 'All expenses'
			: (expenseCategories.find((c) => c.id === budget.categoryId)?.name ?? 'Category');

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>
					{isEdit ? `Edit budget · ${periodLabel}` : `New budget · ${periodLabel}`}
				</DialogTitle>
				<DialogDescription>
					{isEdit
						? `Update the limit for ${editLabel}.`
						: 'Set a spending limit for this month.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				{isEdit ? (
					<div className="grid gap-1.5">
						<Label>Budget for</Label>
						<p className="text-sm font-medium text-foreground">{editLabel}</p>
					</div>
				) : (
					<div className="grid gap-2">
						<Label>Budget for</Label>
						<Select
							value={values.target || undefined}
							onValueChange={(v) => setField('target', v)}
							disabled={pending || availableOptions.length === 0}
						>
							<SelectTrigger
								aria-label="Budget for"
								aria-invalid={Boolean(errors.target)}
								data-testid="budget-target"
							>
								<SelectValue placeholder="Select…" />
							</SelectTrigger>
							<SelectContent>
								{availableOptions.map((opt) => (
									<SelectItem key={opt.value} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.target ? <p className="text-[10px] leading-tight text-destructive">{errors.target}</p> : null}
						{availableOptions.length === 0 ? (
							<p className="text-xs text-muted-foreground">
								All budgets for this month are already set.
							</p>
						) : null}
					</div>
				)}

				<div className="grid gap-2">
					<Label htmlFor="budget-limit">Limit amount</Label>
					<Input
						id="budget-limit"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.limitAmount}
						onChange={(e) => setField('limitAmount', e.target.value)}
						placeholder="50000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.limitAmount)}
						data-testid="budget-limit-input"
					/>
					{errors.limitAmount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.limitAmount}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={pending || (!isEdit && availableOptions.length === 0)}
					data-testid="budget-form-submit"
				>
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save changes'
					) : (
						'Save budget'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
