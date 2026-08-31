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
import type { Saving } from '@/features/savings/types';
import { dateInputToIso, todayDateInput } from '@/features/transactions/utils';

export type SavingMovementMode = 'contribute' | 'withdraw' | 'return';

const COPY: Record<
	SavingMovementMode,
	{ title: string; description: (name: string) => string; submit: string; amountError: string }
> = {
	contribute: {
		title: 'Add Money',
		description: (name) => `Add money to “${name}”.`,
		submit: 'Add Money',
		amountError: 'Amount exceeds Spendable Money',
	},
	withdraw: {
		title: 'Move to Spendable',
		description: (name) => `Move money from “${name}”.`,
		submit: 'Move Money',
		amountError: 'Amount exceeds the savings balance',
	},
	return: {
		title: 'Add Return',
		description: (_name) => 'Add interest or other returns.',
		submit: 'Add Return',
		amountError: '',
	},
};

interface SavingMovementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: SavingMovementMode;
	saving: Saving | null;
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

export function SavingMovementDialog({
	open,
	onOpenChange,
	mode,
	saving,
	preferredCurrency,
	maxAmount,
	pending = false,
	onSubmit,
}: SavingMovementDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && saving ? (
					<MovementFormFields
						key={`${mode}-${saving.id}`}
						mode={mode}
						savingName={saving.name}
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
	mode: SavingMovementMode;
	savingName: string;
	preferredCurrency: string;
	maxAmount?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingMovementDialogProps['onSubmit'];
}

function MovementFormFields({
	mode,
	savingName,
	preferredCurrency,
	maxAmount,
	pending,
	onCancel,
	onSubmit,
}: MovementFormFieldsProps) {
	const copy = COPY[mode];
	const [values, setValues] = useState<SavingMovementFormValues>(() => ({
		amount: '',
		date: todayDateInput(),
		note: '',
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
				<DialogDescription>{copy.description(savingName)}</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`saving-${mode}-amount`}>Amount</Label>
					<Input
						id={`saving-${mode}-amount`}
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						placeholder={mode === 'return' ? 'e.g. 1,000' : 'e.g. 5,000'}
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
						data-testid={`saving-${mode}-amount-input`}
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
					<Label htmlFor={`saving-${mode}-note`}>Note</Label>
					<Input
						id={`saving-${mode}-note`}
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
				<Button type="submit" disabled={pending} data-testid={`saving-${mode}-submit`}>
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
