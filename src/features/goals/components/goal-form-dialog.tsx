import { useState } from 'react';
import { Info, Loader2 } from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	goalFieldErrors,
	goalFormSchema,
	type GoalFormValues,
} from '@/features/goals/schemas';
import type { CreateGoalRequest, SavingsGoal } from '@/features/goals/types';
import { toDateInputValue } from '@/features/goals/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface GoalFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal?: SavingsGoal | null;
	pending?: boolean;
	onSubmit: (
		payload:
			| CreateGoalRequest
			| {
					name: string;
					targetAmount: number;
					targetDate?: string | null;
			  },
	) => Promise<void> | void;
}

export function GoalFormDialog({
	open,
	onOpenChange,
	goal,
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
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalFormDialogProps['onSubmit'];
}

function GoalFormFields({ goal, pending, onCancel, onSubmit }: GoalFormFieldsProps) {
	const isEdit = goal != null;
	const [values, setValues] = useState<GoalFormValues>(() => ({
		name: goal?.name ?? '',
		targetAmount: goal ? String(goal.targetAmount) : '',
		targetDate: goal?.targetDate ? toDateInputValue(goal.targetDate) : '',
		startingAmount: '',
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

		if (isEdit) {
			await onSubmit({
				name: parsed.name,
				targetAmount: Number(parsed.targetAmount),
				targetDate: parsed.targetDate ? dateInputToIso(parsed.targetDate) : null,
			});
			return;
		}

		const createPayload: CreateGoalRequest = {
			name: parsed.name,
			targetAmount: Number(parsed.targetAmount),
		};
		if (parsed.targetDate) {
			createPayload.targetDate = dateInputToIso(parsed.targetDate);
		}
		if (parsed.startingAmount.trim()) {
			createPayload.startingAmount = Number(parsed.startingAmount);
		}
		await onSubmit(createPayload);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this goal.' : "Set a target for something you're saving for."}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="goal-name">Name</Label>
					<Input
						id="goal-name"
						value={values.name}
						onChange={(e) => setField('name', e.target.value)}
						placeholder="e.g. New Goal"
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						data-testid="goal-name-input"
					/>
					{errors.name ? <p className="text-[10px] leading-tight text-destructive">{errors.name}</p> : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="goal-target">Target Amount</Label>
					<Input
						id="goal-target"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.targetAmount}
						onChange={(e) => setField('targetAmount', e.target.value)}
						placeholder="e.g. 10,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.targetAmount)}
						data-testid="goal-target-input"
					/>
					{errors.targetAmount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.targetAmount}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<div className="flex items-center justify-between gap-2">
						<Label>Target Date</Label>
						{values.targetDate ? (
							<button
								type="button"
								className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
								onClick={() => setField('targetDate', '')}
								disabled={pending}
							>
								Clear
							</button>
						) : null}
					</div>
					<DatePicker
						value={values.targetDate}
						onChange={(v) => setField('targetDate', v)}
						placeholder="No target date"
						disabled={pending}
						aria-label="Target date"
					/>
				</div>

				{isEdit ? null : (
					<div className="grid gap-2">
						<div className="flex items-center gap-1">
							<Label htmlFor="goal-starting-amount">Starting Amount</Label>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type="button"
										className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
										aria-label="About starting amount"
									>
										<Info className="size-3.5" aria-hidden="true" />
									</button>
								</TooltipTrigger>
								<TooltipContent sideOffset={6}>
									Money already in this goal.
								</TooltipContent>
							</Tooltip>
						</div>
						<Input
							id="goal-starting-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							value={values.startingAmount}
							onChange={(e) => setField('startingAmount', e.target.value)}
							placeholder="e.g. 10,000"
							className="tabular-nums"
							disabled={pending}
							aria-invalid={Boolean(errors.startingAmount)}
							data-testid="goal-starting-amount-input"
						/>
						{errors.startingAmount ? (
							<p className="text-[10px] leading-tight text-destructive">
								{errors.startingAmount}
							</p>
						) : null}
					</div>
				)}
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
						'Save'
					) : (
						'Create Goal'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
