import { useMemo, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';

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
import {
	exchangeRateFormSchema,
	fieldErrorsFromSchema,
} from '@/features/admin-exchange-rates/schemas';
import type {
	CreateExchangeRateRequest,
	ExchangeRate,
	UpdateExchangeRateRequest,
} from '@/features/admin-exchange-rates/types';
import type { Currency } from '@/features/currencies/types';
import { DEFAULT_CURRENCY } from '@/lib/currencies';

interface ExchangeRateFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item?: ExchangeRate | null;
	currencies: Currency[];
	pending?: boolean;
	onCreate: (payload: CreateExchangeRateRequest) => Promise<void> | void;
	onUpdate: (date: string, payload: UpdateExchangeRateRequest) => Promise<void> | void;
}

export function ExchangeRateFormDialog({
	open,
	onOpenChange,
	item,
	currencies,
	pending = false,
	onCreate,
	onUpdate,
}: ExchangeRateFormDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				{open ? (
					<ExchangeRateFormFields
						key={item?.id ?? 'create'}
						item={item}
						currencies={currencies}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onCreate={onCreate}
						onUpdate={onUpdate}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface ExchangeRateFormFieldsProps {
	item?: ExchangeRate | null;
	currencies: Currency[];
	pending: boolean;
	onCancel: () => void;
	onCreate: ExchangeRateFormDialogProps['onCreate'];
	onUpdate: ExchangeRateFormDialogProps['onUpdate'];
}

function ExchangeRateFormFields({
	item,
	currencies,
	pending,
	onCancel,
	onCreate,
	onUpdate,
}: ExchangeRateFormFieldsProps) {
	const isEdit = item != null;
	const codes = useMemo(() => {
		const list = currencies.map((c) => c.code);
		return list.length > 0 ? list : [DEFAULT_CURRENCY];
	}, [currencies]);

	const [date, setDate] = useState(item?.date ?? '');
	const [notes, setNotes] = useState(item?.notes ?? '');
	const [rates, setRates] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		for (const code of codes) {
			const value = item?.rates[code];
			initial[code] = value != null ? String(value) : code === DEFAULT_CURRENCY ? '1' : '';
		}
		return initial;
	});
	const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

	const handleRateChange = (code: string, value: string) => {
		setRates((prev) => ({ ...prev, [code]: value }));
		const key = `rates.${code}`;
		if (errors[key] || errors.rates) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[key];
				delete next.rates;
				return next;
			});
		}
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();

		const parsedRates: Record<string, number> = {};
		for (const code of codes) {
			const raw = rates[code]?.trim();
			if (!raw) continue;
			parsedRates[code] = Number(raw);
		}

		const values = {
			date,
			notes: notes.trim() || undefined,
			rates: parsedRates,
		};

		const fieldErrors = fieldErrorsFromSchema(exchangeRateFormSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = exchangeRateFormSchema.parse(values);

		if (isEdit) {
			await onUpdate(item.date, {
				rates: parsed.rates,
				notes: parsed.notes ?? null,
				status: 'manual',
			});
			return;
		}

		await onCreate({
			date: parsed.date,
			base: DEFAULT_CURRENCY,
			rates: parsed.rates,
			...(parsed.notes ? { notes: parsed.notes } : {}),
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="grid gap-4">
			<DialogHeader>
				<DialogTitle>{isEdit ? 'Edit rate' : 'Add rate'}</DialogTitle>
				<DialogDescription>
					{isEdit ? `Update rates for ${item.date}.` : 'Add a manual rate for a date.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-2">
				<Label htmlFor="exchange-rate-date">Date</Label>
				<Input
					id="exchange-rate-date"
					type="date"
					value={date}
					onChange={(e) => {
						setDate(e.target.value);
						if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
					}}
					disabled={pending || isEdit}
					aria-invalid={Boolean(errors.date)}
					data-testid="exchange-rate-date"
				/>
				{errors.date ? (
					<p className="text-[10px] leading-tight text-destructive" role="alert">
						{errors.date}
					</p>
				) : null}
			</div>

			<div className="grid gap-2">
				<Label>Rates (base {DEFAULT_CURRENCY})</Label>
				{errors.rates ? (
					<p className="text-[10px] leading-tight text-destructive" role="alert">
						{errors.rates}
					</p>
				) : null}
				<div className="grid gap-2 sm:grid-cols-2">
					{codes.map((code) => (
						<div key={code} className="grid gap-1.5">
							<Label htmlFor={`exchange-rate-${code}`}>{code}</Label>
							<Input
								id={`exchange-rate-${code}`}
								type="number"
								inputMode="decimal"
								step="any"
								min="0"
								value={rates[code] ?? ''}
								onChange={(e) => handleRateChange(code, e.target.value)}
								disabled={pending}
								aria-invalid={Boolean(errors[`rates.${code}`])}
								data-testid={`exchange-rate-value-${code}`}
							/>
							{errors[`rates.${code}`] ? (
								<p className="text-[10px] leading-tight text-destructive" role="alert">
									{errors[`rates.${code}`]}
								</p>
							) : null}
						</div>
					))}
				</div>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="exchange-rate-notes">Notes</Label>
				<Textarea
					id="exchange-rate-notes"
					value={notes}
					onChange={(e) => {
						setNotes(e.target.value);
						if (errors.notes) setErrors((prev) => ({ ...prev, notes: undefined }));
					}}
					disabled={pending}
					rows={3}
					maxLength={500}
					aria-invalid={Boolean(errors.notes)}
					data-testid="exchange-rate-notes"
				/>
				{errors.notes ? (
					<p className="text-[10px] leading-tight text-destructive" role="alert">
						{errors.notes}
					</p>
				) : null}
			</div>

			<DialogFooter>
				<Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="exchange-rate-save">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : isEdit ? (
						'Save'
					) : (
						'Create'
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
