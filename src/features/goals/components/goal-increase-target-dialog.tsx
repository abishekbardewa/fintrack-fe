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
	increaseTargetFieldErrors,
	increaseTargetFormSchema,
	type IncreaseTargetFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';

interface GoalIncreaseTargetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onSubmit: (targetAmount: number) => Promise<void> | void;
}

export function GoalIncreaseTargetDialog({
	open,
	onOpenChange,
	goal,
	pending = false,
	onSubmit,
}: GoalIncreaseTargetDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && goal ? (
					<IncreaseTargetFields
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

interface IncreaseTargetFieldsProps {
	goal: SavingsGoal;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalIncreaseTargetDialogProps['onSubmit'];
}

function IncreaseTargetFields({
	goal,
	pending,
	onCancel,
	onSubmit,
}: IncreaseTargetFieldsProps) {
	const [values, setValues] = useState<IncreaseTargetFormValues>(() => ({
		targetAmount: '',
	}));
	const [errors, setErrors] = useState<
		Partial<Record<keyof IncreaseTargetFormValues, string>>
	>({});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = increaseTargetFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = increaseTargetFormSchema.parse(values);
		const targetAmount = Number(parsed.targetAmount);
		if (targetAmount <= goal.currentAmount) {
			setErrors({ targetAmount: 'Must be above Goal Balance' });
			return;
		}
		await onSubmit(targetAmount);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Increase Target</DialogTitle>
				<DialogDescription>Set a higher target for “{goal.name}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="increase-target-amount">Target Amount</Label>
					<Input
						id="increase-target-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.targetAmount}
						onChange={(e) => {
							setValues({ targetAmount: e.target.value });
							if (errors.targetAmount) setErrors({});
						}}
						placeholder="e.g. 20,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.targetAmount)}
						data-testid="goal-increase-target-amount"
					/>
					{errors.targetAmount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.targetAmount}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="goal-increase-target-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Increase Target'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
