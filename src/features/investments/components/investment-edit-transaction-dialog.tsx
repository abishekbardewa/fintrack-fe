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
	investmentMovementFieldErrors,
	investmentMovementFormSchema,
	type InvestmentMovementFormValues,
} from '@/features/investments/schemas';
import type {
	InvestmentTransaction,
	UpdateInvestmentTransactionRequest,
} from '@/features/investments/types';
import { toDateInputValue } from '@/features/investments/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface InvestmentEditTransactionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: InvestmentTransaction | null;
	investmentName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxInvestmentBalance?: number;
	pending?: boolean;
	onSubmit: (payload: UpdateInvestmentTransactionRequest) => Promise<void> | void;
}

export function InvestmentEditTransactionDialog({
	open,
	onOpenChange,
	transaction,
	investmentName,
	preferredCurrency,
	maxSpendable,
	maxInvestmentBalance,
	pending = false,
	onSubmit,
}: InvestmentEditTransactionDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && transaction ? (
					<EditFormFields
						key={transaction.id}
						transaction={transaction}
						investmentName={investmentName}
						preferredCurrency={preferredCurrency}
						maxSpendable={maxSpendable}
						maxInvestmentBalance={maxInvestmentBalance}
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
	transaction: InvestmentTransaction;
	investmentName: string;
	preferredCurrency: string;
	maxSpendable?: number;
	maxInvestmentBalance?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: InvestmentEditTransactionDialogProps['onSubmit'];
}

function EditFormFields({
	transaction,
	investmentName,
	preferredCurrency,
	maxSpendable,
	maxInvestmentBalance,
	pending,
	onCancel,
	onSubmit,
}: EditFormFieldsProps) {
	const originalAmount = Math.abs(transaction.amountPreferred ?? transaction.amount);
	const isDebit = transaction.source === 'withdrawal' || transaction.source === 'loss';
	const hitsSpendable = transaction.source === 'contribution';
	const [values, setValues] = useState<InvestmentMovementFormValues>(() => ({
		amount: String(originalAmount),
		date: toDateInputValue(transaction.date),
		note: transaction.note ?? '',
	}));
	const [errors, setErrors] = useState<
		Partial<Record<keyof InvestmentMovementFormValues, string>>
	>({});

	const setField = <K extends keyof InvestmentMovementFormValues>(
		key: K,
		value: InvestmentMovementFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = investmentMovementFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = investmentMovementFormSchema.parse(values);
		const amount = Number(parsed.amount);

		if (isDebit && maxInvestmentBalance != null && amount > maxInvestmentBalance + originalAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the investment balance' }));
			return;
		}
		if (
			transaction.source === 'withdrawal' &&
			amount < originalAmount &&
			maxSpendable != null
		) {
			const extra = originalAmount - amount;
			if (extra > maxSpendable) {
				setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
				return;
			}
		}
		if (hitsSpendable && maxSpendable != null && amount > originalAmount) {
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
				<DialogDescription>Update this entry in “{investmentName}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="edit-investment-amount">Amount</Label>
					<Input
						id="edit-investment-amount"
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
					<Label htmlFor="edit-investment-note">Note</Label>
					<Input
						id="edit-investment-note"
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
