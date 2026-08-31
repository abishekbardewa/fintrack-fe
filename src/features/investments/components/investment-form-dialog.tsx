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
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	investmentFieldErrors,
	investmentFormSchema,
	type InvestmentFormValues,
} from '@/features/investments/schemas';
import type {
	CreateInvestmentRequest,
	Investment,
	UpdateInvestmentRequest,
} from '@/features/investments/types';
import { toDateInputValue } from '@/features/investments/utils';
import { dateInputToIso } from '@/features/transactions/utils';

interface InvestmentFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	investment?: Investment | null;
	pending?: boolean;
	onSubmit: (payload: CreateInvestmentRequest | UpdateInvestmentRequest) => Promise<void> | void;
}

export function InvestmentFormDialog({
	open,
	onOpenChange,
	investment,
	pending = false,
	onSubmit,
}: InvestmentFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<InvestmentFormFields
						key={investment?.id ?? 'create'}
						investment={investment}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface InvestmentFormFieldsProps {
	investment?: Investment | null;
	pending: boolean;
	onCancel: () => void;
	onSubmit: InvestmentFormDialogProps['onSubmit'];
}

function InvestmentFormFields({
	investment,
	pending,
	onCancel,
	onSubmit,
}: InvestmentFormFieldsProps) {
	const isEdit = investment != null;
	const [values, setValues] = useState<InvestmentFormValues>(() => ({
		name: investment?.name ?? '',
		notes: investment?.notes ?? '',
		startDate: investment?.startDate ? toDateInputValue(investment.startDate) : '',
		startingAmount: '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof InvestmentFormValues, string>>>({});

	const setField = <K extends keyof InvestmentFormValues>(
		key: K,
		value: InvestmentFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = investmentFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = investmentFormSchema.parse(values);

		if (isEdit) {
			await onSubmit({
				name: parsed.name,
				notes: parsed.notes.trim() || null,
				startDate: parsed.startDate ? dateInputToIso(parsed.startDate) : null,
			});
			return;
		}

		const createPayload: CreateInvestmentRequest = {
			name: parsed.name,
		};
		if (parsed.notes.trim()) createPayload.notes = parsed.notes.trim();
		if (parsed.startDate) createPayload.startDate = dateInputToIso(parsed.startDate);
		if (parsed.startingAmount.trim()) {
			createPayload.startingAmount = Number(parsed.startingAmount);
		}
		await onSubmit(createPayload);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit Investment' : 'Create Investment'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this investment.' : 'Name your investment.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="investment-name">Name</Label>
					<Input
						id="investment-name"
						value={values.name}
						onChange={(e) => setField('name', e.target.value)}
						placeholder="e.g. Investment"
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						data-testid="investment-name-input"
					/>
					{errors.name ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.name}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="investment-notes">Note</Label>
					<Textarea
						id="investment-notes"
						value={values.notes}
						onChange={(e) => setField('notes', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.notes)}
						data-testid="investment-notes-input"
					/>
					{errors.notes ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.notes}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<div className="flex items-center justify-between gap-2">
						<Label>Start Date</Label>
						{values.startDate ? (
							<button
								type="button"
								className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
								onClick={() => setField('startDate', '')}
								disabled={pending}
							>
								Clear
							</button>
						) : null}
					</div>
					<DatePicker
						value={values.startDate}
						onChange={(v) => setField('startDate', v)}
						placeholder="No start date"
						disabled={pending}
						aria-label="Start date"
					/>
				</div>

				{isEdit ? null : (
					<div className="grid gap-2">
						<div className="flex items-center gap-1">
							<Label htmlFor="investment-starting-amount">Starting Amount</Label>
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
									Money already in this investment.
								</TooltipContent>
							</Tooltip>
						</div>
						<Input
							id="investment-starting-amount"
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
							data-testid="investment-starting-amount-input"
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
				<Button type="submit" disabled={pending} data-testid="investment-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save'
					) : (
						'Create Investment'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
