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
	savingsCircleMovementFieldErrors,
	savingsCircleMovementFormSchema,
	type SavingsCircleMovementFormValues,
} from '@/features/savings-circles/schemas';
import type { SavingsCircle } from '@/features/savings-circles/types';
import { dateInputToIso, todayDateInput } from '@/features/transactions/utils';

export type SavingsCircleMovementMode = 'contribute' | 'recordPayout' | 'movePayout';

const COPY: Record<
	SavingsCircleMovementMode,
	{ title: string; description: (name: string) => string; submit: string; amountError: string }
> = {
	contribute: {
		title: 'Add Contribution',
		description: (name) => `Add a contribution to “${name}”.`,
		submit: 'Add Contribution',
		amountError: 'Amount exceeds Spendable Money',
	},
	recordPayout: {
		title: 'Record Payout',
		description: (name) => `Record a payout from “${name}”.`,
		submit: 'Record Payout',
		amountError: '',
	},
	movePayout: {
		title: 'Move to Spendable',
		description: (name) => `Move money from “${name}”.`,
		submit: 'Move Money',
		amountError: 'Amount exceeds the pending payout',
	},
};

interface SavingsCircleMovementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: SavingsCircleMovementMode;
	circle: SavingsCircle | null;
	preferredCurrency: string;
	maxAmount?: number;
	pending?: boolean;
	onSubmit: (payload: {
		amount: number;
		currency?: string;
		date?: string;
		note?: string;
	}) => Promise<void> | void;
}

export function SavingsCircleMovementDialog({
	open,
	onOpenChange,
	mode,
	circle,
	preferredCurrency,
	maxAmount,
	pending = false,
	onSubmit,
}: SavingsCircleMovementDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && circle ? (
					<MovementFormFields
						key={`${mode}-${circle.id}`}
						mode={mode}
						circleName={circle.name}
						preferredCurrency={preferredCurrency}
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

interface MovementFormFieldsProps {
	mode: SavingsCircleMovementMode;
	circleName: string;
	preferredCurrency: string;
	maxAmount?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingsCircleMovementDialogProps['onSubmit'];
}

function MovementFormFields({
	mode,
	circleName,
	preferredCurrency,
	maxAmount,
	pending,
	onCancel,
	onSubmit,
}: MovementFormFieldsProps) {
	const copy = COPY[mode];
	const [values, setValues] = useState<SavingsCircleMovementFormValues>(() => ({
		amount: '',
		date: todayDateInput(),
		note: '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof SavingsCircleMovementFormValues, string>>>(
		{},
	);

	const setField = <K extends keyof SavingsCircleMovementFormValues>(
		key: K,
		value: SavingsCircleMovementFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = savingsCircleMovementFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = savingsCircleMovementFormSchema.parse(values);
		const amount = Number(parsed.amount);
		if (maxAmount != null && amount > maxAmount) {
			setErrors((prev) => ({ ...prev, amount: copy.amountError }));
			return;
		}
		if (mode !== 'contribute' && !parsed.date) {
			setErrors((prev) => ({ ...prev, date: 'Date is required' }));
			return;
		}
		await onSubmit({
			amount,
			...(mode === 'contribute'
				? {}
				: { currency: preferredCurrency, date: dateInputToIso(parsed.date) }),
			note: parsed.note.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{copy.title}</DialogTitle>
				<DialogDescription>{copy.description(circleName)}</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`circle-${mode}-amount`}>Amount</Label>
					<Input
						id={`circle-${mode}-amount`}
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
						data-testid={`circle-${mode}-amount-input`}
					/>
					{errors.amount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
					) : null}
				</div>

				{mode !== 'contribute' ? (
					<div className="grid gap-2">
						<Label>Date</Label>
						<DatePicker
							value={values.date}
							onChange={(v) => setField('date', v)}
							disabled={pending}
							invalid={Boolean(errors.date)}
							aria-label="Date"
						/>
						{errors.date ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.date}</p>
						) : null}
					</div>
				) : null}

				<div className="grid gap-2">
					<Label htmlFor={`circle-${mode}-note`}>Note</Label>
					<Input
						id={`circle-${mode}-note`}
						value={values.note}
						onChange={(e) => setField('note', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.note)}
					/>
					{errors.note ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.note}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid={`circle-${mode}-submit`}>
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						copy.submit
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
