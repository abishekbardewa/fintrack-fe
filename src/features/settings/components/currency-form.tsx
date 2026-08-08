import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { AuthUser } from '@/features/auth/types';
import { useCurrenciesQuery } from '@/features/currencies/hooks/use-currencies';
import { useUpdateMeMutation } from '@/features/settings/hooks/use-profile';
import {
	currencyFormSchema,
	fieldErrorsFromSchema,
	type CurrencyFormValues,
} from '@/features/settings/schemas';
import { getErrorMessage, getFieldErrors } from '@/lib/api/errors';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/currencies';

interface CurrencyFormProps {
	user: AuthUser;
}

const CURRENCY_FIELDS = ['currency'] as const;

export function CurrencyForm({ user }: CurrencyFormProps) {
	return (
		<CurrencyFormFields
			key={`${user.id}:${user.updatedAt ?? ''}:${user.currency ?? ''}`}
			user={user}
		/>
	);
}

function CurrencyFormFields({ user }: CurrencyFormProps) {
	const updateMutation = useUpdateMeMutation();
	const currenciesQuery = useCurrenciesQuery(true);
	const initialCurrency = user.currency || DEFAULT_CURRENCY;

	const [currency, setCurrency] = useState(initialCurrency);
	const [errors, setErrors] = useState<Partial<Record<keyof CurrencyFormValues, string>>>({});

	const currencyOptions =
		currenciesQuery.data?.currencies?.length
			? currenciesQuery.data.currencies
			: SUPPORTED_CURRENCIES;

	const pending = updateMutation.isPending;
	const dirty = currency !== initialCurrency;

	const handleCancel = () => {
		setCurrency(initialCurrency);
		setErrors({});
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const values = { currency };
		const fieldErrors = fieldErrorsFromSchema(currencyFormSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = currencyFormSchema.parse(values);
		if (parsed.currency === initialCurrency) {
			toast.message('No changes to save');
			return;
		}

		try {
			await updateMutation.mutateAsync({ currency: parsed.currency });
			toast.success('Currency updated');
		} catch (error) {
			const apiFields = getFieldErrors(error, CURRENCY_FIELDS);
			if (Object.keys(apiFields).length > 0) {
				setErrors(apiFields);
				return;
			}
			toast.error(getErrorMessage(error, 'Could not update currency.'));
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="grid gap-6">
			<div>
				<h2 className="text-lg font-semibold tracking-tight">Preferred Currency</h2>
			</div>

			<div className="grid max-w-md gap-2">
				<Label htmlFor="settings-currency">Currency</Label>
				<Select
					value={currency}
					onValueChange={(v) => {
						setCurrency(v);
						if (errors.currency) setErrors((prev) => ({ ...prev, currency: undefined }));
					}}
					disabled={pending || currenciesQuery.isLoading}
				>
					<SelectTrigger
						id="settings-currency"
						className="w-full"
						aria-invalid={Boolean(errors.currency)}
						data-testid="settings-currency"
					>
						<SelectValue placeholder="Select currency" />
					</SelectTrigger>
					<SelectContent>
						{currencyOptions.map((c) => (
							<SelectItem key={c.code} value={c.code}>
								{c.code} — {c.name}
								{c.symbol ? ` (${c.symbol})` : ''}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{errors.currency ? (
					<p className="text-sm text-destructive" role="alert">
						{errors.currency}
					</p>
				) : null}
			</div>

			<div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
				<Button
					type="button"
					variant="ghost"
					onClick={handleCancel}
					disabled={pending || !dirty}
					data-testid="settings-currency-cancel"
				>
					Cancel
				</Button>
				<Button type="submit" disabled={pending || !dirty} data-testid="settings-currency-save">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						'Save Changes'
					)}
				</Button>
			</div>
		</form>
	);
}
