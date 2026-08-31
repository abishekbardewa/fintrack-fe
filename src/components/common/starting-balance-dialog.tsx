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
import { dateInputToIso, todayDateInput } from '@/features/transactions/utils';

interface StartingBalanceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	pending?: boolean;
	testIdPrefix?: string;
	onSubmit: (payload: { amount: number; date: string }) => Promise<void> | void;
}

export function StartingBalanceDialog({
	open,
	onOpenChange,
	title,
	description,
	pending = false,
	testIdPrefix = 'starting-balance',
	onSubmit,
}: StartingBalanceDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<StartingBalanceFields
						key={title}
						title={title}
						description={description}
						pending={pending}
						testIdPrefix={testIdPrefix}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface StartingBalanceFieldsProps {
	title: string;
	description: string;
	pending: boolean;
	testIdPrefix: string;
	onCancel: () => void;
	onSubmit: StartingBalanceDialogProps['onSubmit'];
}

function StartingBalanceFields({
	title,
	description,
	pending,
	testIdPrefix,
	onCancel,
	onSubmit,
}: StartingBalanceFieldsProps) {
	const [amount, setAmount] = useState('');
	const [date, setDate] = useState(todayDateInput());
	const [amountError, setAmountError] = useState<string | null>(null);
	const [dateError, setDateError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = amount.trim();
		const parsedAmount = Number(trimmed);
		if (!trimmed || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
			setAmountError('Enter a positive amount');
			return;
		}
		if (!date) {
			setDateError('Date is required');
			return;
		}
		await onSubmit({ amount: parsedAmount, date: dateInputToIso(date) });
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>{description}</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor={`${testIdPrefix}-amount`}>Amount</Label>
					<Input
						id={`${testIdPrefix}-amount`}
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={amount}
						onChange={(e) => {
							setAmount(e.target.value);
							if (amountError) setAmountError(null);
						}}
						placeholder="e.g. 10,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(amountError)}
						data-testid={`${testIdPrefix}-amount-input`}
					/>
					{amountError ? (
						<p className="text-[10px] leading-tight text-destructive">{amountError}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label>Date</Label>
					<DatePicker
						value={date}
						onChange={(v) => {
							setDate(v);
							if (dateError) setDateError(null);
						}}
						disabled={pending}
						invalid={Boolean(dateError)}
						aria-label="Starting balance date"
					/>
					{dateError ? (
						<p className="text-[10px] leading-tight text-destructive">{dateError}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid={`${testIdPrefix}-submit`}>
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
