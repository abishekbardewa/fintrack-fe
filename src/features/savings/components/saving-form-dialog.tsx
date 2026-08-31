import { useState } from 'react';
import { Info, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
	savingFieldErrors,
	savingFormSchema,
	type SavingFormValues,
} from '@/features/savings/schemas';
import type { CreateSavingRequest, Saving, UpdateSavingRequest } from '@/features/savings/types';

interface SavingFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	saving?: Saving | null;
	pending?: boolean;
	onSubmit: (payload: CreateSavingRequest | UpdateSavingRequest) => Promise<void> | void;
}

export function SavingFormDialog({
	open,
	onOpenChange,
	saving,
	pending = false,
	onSubmit,
}: SavingFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<SavingFormFields
						key={saving?.id ?? 'create'}
						saving={saving}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface SavingFormFieldsProps {
	saving?: Saving | null;
	pending: boolean;
	onCancel: () => void;
	onSubmit: SavingFormDialogProps['onSubmit'];
}

function SavingFormFields({ saving, pending, onCancel, onSubmit }: SavingFormFieldsProps) {
	const isEdit = saving != null;
	const [values, setValues] = useState<SavingFormValues>(() => ({
		name: saving?.name ?? '',
		notes: saving?.notes ?? '',
		startingAmount: '',
	}));
	const [errors, setErrors] = useState<Partial<Record<keyof SavingFormValues, string>>>({});

	const setField = <K extends keyof SavingFormValues>(key: K, value: SavingFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = savingFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = savingFormSchema.parse(values);
		if (isEdit) {
			await onSubmit({
				name: parsed.name,
				notes: parsed.notes.trim() || null,
			});
			return;
		}

		const createPayload: CreateSavingRequest = {
			name: parsed.name,
		};
		if (parsed.notes.trim()) {
			createPayload.notes = parsed.notes.trim();
		}
		if (parsed.startingAmount.trim()) {
			createPayload.startingAmount = Number(parsed.startingAmount);
		}
		await onSubmit(createPayload);
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit Savings' : 'Create Savings'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this savings.' : 'Name your savings.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="saving-name">Name</Label>
					<Input
						id="saving-name"
						value={values.name}
						onChange={(e) => setField('name', e.target.value)}
						placeholder="e.g. My Savings"
						disabled={pending}
						aria-invalid={Boolean(errors.name)}
						data-testid="saving-name-input"
					/>
					{errors.name ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.name}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="saving-notes">Note</Label>
					<Textarea
						id="saving-notes"
						value={values.notes}
						onChange={(e) => setField('notes', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.notes)}
						data-testid="saving-notes-input"
					/>
					{errors.notes ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.notes}</p>
					) : null}
				</div>

				{isEdit ? null : (
					<div className="grid gap-2">
						<div className="flex items-center gap-1">
							<Label htmlFor="saving-starting-amount">Starting Amount</Label>
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
									Money already in this savings.
								</TooltipContent>
							</Tooltip>
						</div>
						<Input
							id="saving-starting-amount"
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
							data-testid="saving-starting-amount-input"
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
				<Button type="submit" disabled={pending} data-testid="saving-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save'
					) : (
						'Create Savings'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
