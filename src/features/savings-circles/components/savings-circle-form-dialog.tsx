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
import { Textarea } from '@/components/ui/textarea';
import {
	savingsCircleFieldErrors,
	savingsCircleFormSchema,
	type SavingsCircleFormValues,
} from '@/features/savings-circles/schemas';
import type {
	CreateSavingsCircleRequest,
	SavingsCircle,
	SavingsCircleFrequency,
	UpdateSavingsCircleRequest,
} from '@/features/savings-circles/types';
import { toDateInputValue } from '@/features/savings-circles/utils';
import { dateInputToIso, todayDateInput } from '@/features/transactions/utils';

interface SavingsCircleFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	circle?: SavingsCircle | null;
	pending?: boolean;
	onSubmit: (payload: CreateSavingsCircleRequest | UpdateSavingsCircleRequest) => Promise<void> | void;
}

export function SavingsCircleFormDialog({
	open,
	onOpenChange,
	circle,
	pending = false,
	onSubmit,
}: SavingsCircleFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<CircleFormFields
						key={circle?.id ?? 'create-circle'}
						circle={circle}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface CircleFormFieldsProps {
	circle?: SavingsCircle | null;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingsCircleFormDialogProps['onSubmit'];
}

function CircleFormFields({ circle, pending, onCancel, onSubmit }: CircleFormFieldsProps) {
	const isEdit = circle != null;
	const [values, setValues] = useState<SavingsCircleFormValues>(() => ({
		name: circle?.name ?? '',
		contributionAmount: circle?.contributionAmount != null ? String(circle.contributionAmount) : '',
		frequency: circle?.frequency ?? 'monthly',
		memberCount: circle?.memberCount != null ? String(circle.memberCount) : '',
		startDate: circle?.startDate ? toDateInputValue(circle.startDate) : todayDateInput(),
		expectedPayout: circle?.expectedPayout != null ? String(circle.expectedPayout) : '',
		notes: circle?.notes ?? '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof SavingsCircleFormValues, string>>>({});

	const setField = <K extends keyof SavingsCircleFormValues>(
		key: K,
		value: SavingsCircleFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = savingsCircleFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = savingsCircleFormSchema.parse(values);
		const contributionAmount = Number(parsed.contributionAmount);
		const memberCount = Number(parsed.memberCount);
		const expectedPayout = parsed.expectedPayout.trim()
			? Number(parsed.expectedPayout)
			: undefined;

		if (isEdit) {
			await onSubmit({
				name: parsed.name,
				notes: parsed.notes.trim() || null,
				contributionAmount,
				frequency: parsed.frequency,
				memberCount,
				startDate: dateInputToIso(parsed.startDate),
				...(expectedPayout != null ? { expectedPayout } : {}),
			});
			return;
		}

		const payload: CreateSavingsCircleRequest = {
			name: parsed.name,
			contributionAmount,
			frequency: parsed.frequency,
			memberCount,
			startDate: dateInputToIso(parsed.startDate),
		};
		if (parsed.notes.trim()) payload.notes = parsed.notes.trim();
		if (expectedPayout != null) payload.expectedPayout = expectedPayout;
		await onSubmit(payload);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit Circle' : 'Create Circle'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this circle.' : 'Name your circle.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="circle-name">Name</Label>
					<Input
						id="circle-name"
						value={values.name}
						onChange={(e) => setField('name', e.target.value)}
						placeholder="e.g. Circle"
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						data-testid="circle-name-input"
					/>
					{errors.name ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.name}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="circle-notes">Note</Label>
					<Textarea
						id="circle-notes"
						value={values.notes}
						onChange={(e) => setField('notes', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.notes)}
						data-testid="circle-notes-input"
					/>
					{errors.notes ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.notes}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="circle-contribution">Contribution Amount</Label>
					<Input
						id="circle-contribution"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.contributionAmount}
						onChange={(e) => setField('contributionAmount', e.target.value)}
						placeholder="e.g. 5,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.contributionAmount)}
					/>
					{errors.contributionAmount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.contributionAmount}</p>
					) : null}
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="grid gap-2">
						<Label>Frequency</Label>
						<Select
							value={values.frequency}
							onValueChange={(value) => setField('frequency', value as SavingsCircleFrequency)}
							disabled={pending}
						>
							<SelectTrigger className="w-full" aria-invalid={Boolean(errors.frequency)}>
								<SelectValue placeholder="Frequency" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="weekly">Weekly</SelectItem>
								<SelectItem value="monthly">Monthly</SelectItem>
								<SelectItem value="yearly">Yearly</SelectItem>
							</SelectContent>
						</Select>
						{errors.frequency ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.frequency}</p>
						) : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="circle-members">Members</Label>
						<Input
							id="circle-members"
							type="number"
							inputMode="numeric"
							min="2"
							step="1"
							value={values.memberCount}
							onChange={(e) => setField('memberCount', e.target.value)}
							placeholder="e.g. 10"
							className="tabular-nums"
							disabled={pending}
							aria-invalid={Boolean(errors.memberCount)}
						/>
						{errors.memberCount ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.memberCount}</p>
						) : null}
					</div>
				</div>

				<div className="grid gap-2">
					<Label>Start Date</Label>
					<DatePicker
						value={values.startDate}
						onChange={(v) => setField('startDate', v)}
						disabled={pending}
						invalid={Boolean(errors.startDate)}
						aria-label="Start date"
					/>
					{errors.startDate ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.startDate}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="circle-payout">Expected Payout</Label>
					<Input
						id="circle-payout"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.expectedPayout}
						onChange={(e) => setField('expectedPayout', e.target.value)}
						placeholder="e.g. 50,000"
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.expectedPayout)}
					/>
					{errors.expectedPayout ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.expectedPayout}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="circle-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save'
					) : (
						'Create Circle'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
