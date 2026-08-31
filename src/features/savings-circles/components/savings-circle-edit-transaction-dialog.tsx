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
import type {
	SavingsCircleTransaction,
	UpdateSavingsCircleTransactionRequest,
} from '@/features/savings-circles/types';
import { toDateInputValue } from '@/features/savings-circles/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface SavingsCircleEditTransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: SavingsCircleTransaction | null;
	circleName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxPendingPayout?: number;
	pending?: boolean;
	onSubmit: (payload: UpdateSavingsCircleTransactionRequest) => Promise<void> | void;
}

export function SavingsCircleEditTransactionDialog({
	open,
	onOpenChange,
	transaction,
	circleName,
	preferredCurrency,
	maxSpendable,
	maxPendingPayout,
	pending = false,
	onSubmit,
}: SavingsCircleEditTransactionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && transaction ? (
					<EditFormFields
						key={transaction.id}
						transaction={transaction}
						circleName={circleName}
						preferredCurrency={preferredCurrency}
						maxSpendable={maxSpendable}
						maxPendingPayout={maxPendingPayout}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface EditFormFieldsProps {
	transaction: SavingsCircleTransaction;
	circleName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxPendingPayout?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingsCircleEditTransactionDialogProps['onSubmit'];
}

function EditFormFields({
	transaction,
	circleName,
	preferredCurrency,
	maxSpendable,
	maxPendingPayout,
	pending,
	onCancel,
	onSubmit,
}: EditFormFieldsProps) {
	const originalAmount = Math.abs(transaction.amountPreferred ?? transaction.amount);
	const isMovePayout = transaction.source === 'payout_to_spendable';
	const isPayout = transaction.source === 'payout';
	const [values, setValues] = useState<SavingsCircleMovementFormValues>(() => ({
		amount: String(originalAmount),
		date: toDateInputValue(transaction.date),
		note: transaction.note ?? '',
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

		if (isMovePayout && maxPendingPayout != null && amount > maxPendingPayout + originalAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the pending payout' }));
			return;
		}
		if (isMovePayout && amount < originalAmount && maxSpendable != null) {
			const extra = originalAmount - amount;
			if (extra > maxSpendable) {
				setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
				return;
			}
		}
		if (!isMovePayout && !isPayout && maxSpendable != null && amount > originalAmount) {
			const extra = amount - originalAmount;
			if (extra > maxSpendable) {
				setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
				return;
			}
		}

		await onSubmit({
			amount,
			currency: preferredCurrency,
			date: dateInputToIso(parsed.date),
			note: parsed.note.trim() || null,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Edit</DialogTitle>
				<DialogDescription>Update this entry in “{circleName}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="edit-circle-amount">Amount</Label>
					<Input
						id="edit-circle-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
					/>
					{errors.amount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
					) : null}
				</div>

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

				<div className="grid gap-2">
					<Label htmlFor="edit-circle-note">Note</Label>
					<Input
						id="edit-circle-note"
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
				<Button type="submit" disabled={pending}>
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Save'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
