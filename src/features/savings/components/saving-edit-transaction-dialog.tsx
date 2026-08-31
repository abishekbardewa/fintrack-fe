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
	savingMovementFieldErrors,
	savingMovementFormSchema,
	type SavingMovementFormValues,
} from '@/features/savings/schemas';
import type { SavingTransaction, UpdateSavingTransactionRequest } from '@/features/savings/types';
import { toDateInputValue } from '@/features/savings/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface SavingEditTransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: SavingTransaction | null;
	savingName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxSavingBalance?: number;
	pending?: boolean;
	onSubmit: (payload: UpdateSavingTransactionRequest) => Promise<void> | void;
}

export function SavingEditTransactionDialog({
	open,
	onOpenChange,
	transaction,
	savingName,
	preferredCurrency,
	maxSpendable,
	maxSavingBalance,
	pending = false,
	onSubmit,
}: SavingEditTransactionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && transaction ? (
					<EditFormFields
						key={transaction.id}
						transaction={transaction}
						savingName={savingName}
						preferredCurrency={preferredCurrency}
						maxSpendable={maxSpendable}
						maxSavingBalance={maxSavingBalance}
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
	transaction: SavingTransaction;
	savingName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxSavingBalance?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingEditTransactionDialogProps['onSubmit'];
}

function EditFormFields({
	transaction,
	savingName,
	preferredCurrency,
	maxSpendable,
	maxSavingBalance,
	pending,
	onCancel,
	onSubmit,
}: EditFormFieldsProps) {
	const originalAmount = Math.abs(transaction.amountPreferred ?? transaction.amount);
	const isWithdrawal = transaction.source === 'withdrawal';
	const isStarting = transaction.source === 'starting_balance';
	const isReturn = transaction.source === 'return';
	const [values, setValues] = useState<SavingMovementFormValues>(() => ({
		amount: String(originalAmount),
		date: toDateInputValue(transaction.date),
		note: transaction.note ?? '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof SavingMovementFormValues, string>>>(
		{},
	);

	const setField = <K extends keyof SavingMovementFormValues>(
		key: K,
		value: SavingMovementFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = savingMovementFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = savingMovementFormSchema.parse(values);
		const amount = Number(parsed.amount);

		if (isWithdrawal && maxSavingBalance != null && amount > maxSavingBalance + originalAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the savings balance' }));
			return;
		}
		if (isWithdrawal && amount < originalAmount && maxSpendable != null) {
			const extra = originalAmount - amount;
			if (extra > maxSpendable) {
				setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
				return;
			}
		}
		if (!isWithdrawal && !isStarting && !isReturn && maxSpendable != null && amount > originalAmount) {
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
				<DialogDescription>Update this entry in “{savingName}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="edit-saving-amount">Amount</Label>
					<Input
						id="edit-saving-amount"
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
					<Label htmlFor="edit-saving-note">Note</Label>
					<Input
						id="edit-saving-note"
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
