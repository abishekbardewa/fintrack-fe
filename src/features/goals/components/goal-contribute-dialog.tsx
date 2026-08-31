import { useState } from 'react';
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
import { GoalNoteLabel } from '@/features/goals/components/goal-note-label';
import {
	contributeFieldErrors,
	contributeFormSchema,
	type ContributeFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';

interface GoalContributeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	maxAmount?: number;
	pending?: boolean;
	onSubmit: (payload: { amount: number; note?: string }) => Promise<void> | void;
}

export function GoalContributeDialog({
	open,
	onOpenChange,
	goal,
	maxAmount,
	pending = false,
	onSubmit,
}: GoalContributeDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && goal ? (
					<ContributeFormFields
						key={goal.id}
						goalName={goal.name}
						maxAmount={maxAmount}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface ContributeFormFieldsProps {
	goalName: string;
	maxAmount?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalContributeDialogProps['onSubmit'];
}

function ContributeFormFields({
	goalName,
	maxAmount,
	pending,
	onCancel,
	onSubmit,
}: ContributeFormFieldsProps) {
	const [values, setValues] = useState<ContributeFormValues>(() => ({
		amount: '',
		note: '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof ContributeFormValues, string>>>({});

	const setField = <K extends keyof ContributeFormValues>(
		key: K,
		value: ContributeFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = contributeFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = contributeFormSchema.parse(values);
		const amount = Number(parsed.amount);
		if (maxAmount != null && amount > maxAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
			return;
		}
		await onSubmit({
			amount,
			note: parsed.note.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Add Money</DialogTitle>
				<DialogDescription>Add money to “{goalName}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="contrib-amount">Amount</Label>
					<Input
						id="contrib-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						placeholder="e.g. 5,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
						data-testid="contribution-amount-input"
					/>
					{errors.amount ? <p className="text-[10px] leading-tight text-destructive">{errors.amount}</p> : null}
				</div>

				<div className="grid gap-2">
					<GoalNoteLabel htmlFor="contrib-note" />
					<Input
						id="contrib-note"
						value={values.note}
						onChange={(e) => setField('note', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.note)}
					/>
					{errors.note ? <p className="text-[10px] leading-tight text-destructive">{errors.note}</p> : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="contribution-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Add Money'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
