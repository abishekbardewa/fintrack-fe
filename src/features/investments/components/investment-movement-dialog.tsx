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
import type { Investment } from '@/features/investments/types';
import { dateInputToIso, todayDateInput } from '@/features/transactions/utils';

export type InvestmentMovementMode = 'contribute' | 'withdraw' | 'return' | 'loss';

const COPY: Record<
	InvestmentMovementMode,
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
		amountError: 'Amount exceeds the investment balance',
	},
	return: {
		title: 'Add Return',
		description: (name) => `Add a return to “${name}”.`,
		submit: 'Add Return',
		amountError: '',
	},
	loss: {
		title: 'Record Loss',
		description: (name) => `Record money lost from “${name}”.`,
		submit: 'Record Loss',
		amountError: 'Amount exceeds the investment balance',
	},
};

interface InvestmentMovementDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: InvestmentMovementMode;
	investment: Investment | null;
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

export function InvestmentMovementDialog({
	open,
	onOpenChange,
	mode,
	investment,
	preferredCurrency,
	maxAmount,
	pending = false,
	onSubmit,
}: InvestmentMovementDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && investment ? (
					<MovementFormFields
						key={`${mode}-${investment.id}`}
						mode={mode}
						investmentName={investment.name}
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
	mode: InvestmentMovementMode;
	investmentName: string;
	preferredCurrency: string;
	maxAmount?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: InvestmentMovementDialogProps['onSubmit'];
}

function MovementFormFields({
	mode,
	investmentName,
	preferredCurrency,
	maxAmount,
	pending,
	onCancel,
	onSubmit,
}: MovementFormFieldsProps) {
	const copy = COPY[mode];
	const [values, setValues] = useState<InvestmentMovementFormValues>(() => ({
		amount: '',
		date: todayDateInput(),
		note: '',
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
				<DialogDescription>{copy.description(investmentName)}</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`investment-${mode}-amount`}>Amount</Label>
					<Input
						id={`investment-${mode}-amount`}
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						placeholder={
							mode === 'return' || mode === 'loss' ? 'e.g. 1,000' : 'e.g. 5,000'
						}
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
						data-testid={`investment-${mode}-amount-input`}
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
					<Label htmlFor={`investment-${mode}-note`}>Note</Label>
					<Input
						id={`investment-${mode}-note`}
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
				<Button type="submit" disabled={pending} data-testid={`investment-${mode}-submit`}>
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
