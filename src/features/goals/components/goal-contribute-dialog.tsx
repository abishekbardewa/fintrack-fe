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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	contributionFieldErrors,
	contributionFormSchema,
	type ContributionFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';
import { todayDateInput, dateInputToIso } from '@/features/transactions/utils';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface GoalContributeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	defaultCurrency: string;
	pending?: boolean;
	onSubmit: (payload: {
		amount: number;
		currency: string;
		date: string;
		note?: string;
	}) => Promise<void> | void;
}

export function GoalContributeDialog({
	open,
	onOpenChange,
	goal,
	defaultCurrency,
	pending = false,
	onSubmit,
}: GoalContributeDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && goal ? (
					<ContributeFormFields
						key={goal.id}
						goalName={goal.name}
						defaultCurrency={defaultCurrency}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface ContributeFormFieldsProps {
	goalName: string;
	defaultCurrency: string;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalContributeDialogProps['onSubmit'];
}

function ContributeFormFields({
	goalName,
	defaultCurrency,
	pending,
	onCancel,
	onSubmit,
}: ContributeFormFieldsProps) {
	const [values, setValues] = useState<ContributionFormValues>(() => ({
		amount: '',
		currency: defaultCurrency as ContributionFormValues['currency'],
		date: todayDateInput(),
		note: '',
	}));
	const [errors, setErrors] = useState<
		Partial<Record<keyof ContributionFormValues, string>>
	>({});

	const setField = <K extends keyof ContributionFormValues>(
		key: K,
		value: ContributionFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = contributionFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = contributionFormSchema.parse(values);
		await onSubmit({
			amount: Number(parsed.amount),
			currency: parsed.currency,
			date: dateInputToIso(parsed.date),
			note: parsed.note.trim() || undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Add contribution</DialogTitle>
				<DialogDescription>
					Add money toward &ldquo;{goalName}&rdquo;. Progress updates automatically.
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="contrib-amount">Amount</Label>
					<Input
						id="contrib-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						placeholder="500"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
						data-testid="contribution-amount-input"
					/>
					{errors.amount ? <p className="text-sm text-destructive">{errors.amount}</p> : null}
				</div>

				<div className="grid gap-2">
					<Label>Currency</Label>
					<Select
						value={values.currency}
						onValueChange={(v) =>
							setField('currency', v as ContributionFormValues['currency'])
						}
						disabled={pending}
					>
						<SelectTrigger aria-label="Contribution currency">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SUPPORTED_CURRENCIES.map((c) => (
								<SelectItem key={c.code} value={c.code}>
									{c.code}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-2">
					<Label>Date</Label>
					<DatePicker
						value={values.date}
						onChange={(v) => setField('date', v)}
						disabled={pending}
						invalid={Boolean(errors.date)}
						aria-label="Contribution date"
					/>
					{errors.date ? <p className="text-sm text-destructive">{errors.date}</p> : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="contrib-note">Note (optional)</Label>
					<Input
						id="contrib-note"
						value={values.note}
						onChange={(e) => setField('note', e.target.value)}
						placeholder="August savings"
						disabled={pending}
						aria-invalid={Boolean(errors.note)}
					/>
					{errors.note ? <p className="text-sm text-destructive">{errors.note}</p> : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="contribution-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Add contribution'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
