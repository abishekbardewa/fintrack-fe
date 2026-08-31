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
import {
	returnToAvailableFieldErrors,
	returnToAvailableFormSchema,
	type ReturnToAvailableFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';

interface GoalReturnDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onSubmit: (payload: { amount: number }) => Promise<void> | void;
}

export function GoalReturnDialog({
	open,
	onOpenChange,
	goal,
	pending = false,
	onSubmit,
}: GoalReturnDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && goal ? (
					<ReturnFormFields
						key={goal.id}
						goal={goal}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface ReturnFormFieldsProps {
	goal: SavingsGoal;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalReturnDialogProps['onSubmit'];
}

function ReturnFormFields({
	goal,
	pending,
	onCancel,
	onSubmit,
}: ReturnFormFieldsProps) {
	const [values, setValues] = useState<ReturnToAvailableFormValues>(() => ({
		amount: '',
	}));
	const [errors, setErrors] = useState<
		Partial<Record<keyof ReturnToAvailableFormValues, string>>
	>({});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = returnToAvailableFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = returnToAvailableFormSchema.parse(values);
		await onSubmit({ amount: Number(parsed.amount) });
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Move to Spendable</DialogTitle>
				<DialogDescription>Move money from “{goal.name}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="return-amount">Amount</Label>
					<Input
						id="return-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => {
							setValues((prev) => ({ ...prev, amount: e.target.value }));
							if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
						}}
						placeholder="e.g. 5,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
						data-testid="goal-return-amount"
					/>
					{errors.amount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="goal-return-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Move Money'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
