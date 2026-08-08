import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
	goalFieldErrors,
	goalFormSchema,
	type GoalFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';
import { toDateInputValue } from '@/features/goals/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface GoalFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal?: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onSubmit: (payload: {
		name: string;
		targetAmount: number;
		currency?: string;
		targetDate?: string | null;
	}) => Promise<void> | void;
}

export function GoalFormDialog({
	open,
	onOpenChange,
	goal,
	preferredCurrency,
	pending = false,
	onSubmit,
}: GoalFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<GoalFormFields
						key={goal?.id ?? 'create'}
						goal={goal}
						preferredCurrency={preferredCurrency}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface GoalFormFieldsProps {
	goal?: SavingsGoal | null;
	preferredCurrency: string;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalFormDialogProps['onSubmit'];
}

function GoalFormFields({
	goal,
	preferredCurrency,
	pending,
	onCancel,
	onSubmit,
}: GoalFormFieldsProps) {
	const isEdit = goal != null;
	const [values, setValues] = useState<GoalFormValues>(() => ({
		name: goal?.name ?? '',
		targetAmount: goal ? String(goal.targetAmount) : '',
		targetDate: goal?.targetDate ? toDateInputValue(goal.targetDate) : '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof GoalFormValues, string>>>({});

	const setField = <K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = goalFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = goalFormSchema.parse(values);
		await onSubmit({
			name: parsed.name,
			targetAmount: Number(parsed.targetAmount),
			...(isEdit ? {} : { currency: preferredCurrency }),
			targetDate: parsed.targetDate ? dateInputToIso(parsed.targetDate) : null,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit goal' : 'New savings goal'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this goal.' : 'Set a target amount and optional date.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="goal-name">Name</Label>
					<Input
						id="goal-name"
						value={values.name}
						onChange={(e) => setField('name', e.target.value)}
						placeholder="Emergency fund"
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						data-testid="goal-name-input"
					/>
					{errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="goal-target">Target amount</Label>
					<Input
						id="goal-target"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.targetAmount}
						onChange={(e) => setField('targetAmount', e.target.value)}
						placeholder="10000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.targetAmount)}
						data-testid="goal-target-input"
					/>
					{errors.targetAmount ? (
						<p className="text-sm text-destructive">{errors.targetAmount}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label>Target date (optional)</Label>
					<DatePicker
						value={values.targetDate}
						onChange={(v) => setField('targetDate', v)}
						placeholder="No target date"
						disabled={pending}
						aria-label="Target date"
					/>
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="goal-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save changes'
					) : (
						'Create goal'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
