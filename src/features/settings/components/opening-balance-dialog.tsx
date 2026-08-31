import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useCurrenciesQuery } from '@/features/currencies/hooks/use-currencies';
import { useUpdateMeMutation } from '@/features/settings/hooks/use-profile';
import {
	fieldErrorsFromSchema,
	openingBalanceFormSchema,
	type OpeningBalanceFormValues,
} from '@/features/settings/schemas';
import { getErrorMessage } from '@/lib/api/errors';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface OpeningBalanceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultCurrency: string;
	initialAmount?: string;
	initialCurrency?: string;
}

export function OpeningBalanceDialog({
	open,
	onOpenChange,
	defaultCurrency,
	initialAmount = '',
	initialCurrency,
}: OpeningBalanceDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open ? (
					<OpeningBalanceForm
						key={`${initialAmount}:${initialCurrency ?? defaultCurrency}`}
						defaultCurrency={defaultCurrency}
						initialAmount={initialAmount}
						initialCurrency={initialCurrency ?? defaultCurrency}
						onCancel={() => onOpenChange(false)}
						onSuccess={() => onOpenChange(false)}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface OpeningBalanceFormProps {
	defaultCurrency: string;
	initialAmount: string;
	initialCurrency: string;
	onCancel: () => void;
	onSuccess: () => void;
}

function OpeningBalanceForm({
	initialAmount,
	initialCurrency,
	onCancel,
	onSuccess,
}: OpeningBalanceFormProps) {
	const updateMutation = useUpdateMeMutation();
	const currenciesQuery = useCurrenciesQuery(true);
	const [amount, setAmount] = useState(initialAmount);
	const [currency, setCurrency] = useState(initialCurrency);
	const [errors, setErrors] = useState<Partial<Record<keyof OpeningBalanceFormValues, string>>>({});

	const currencyOptions =
		currenciesQuery.data?.currencies?.length
			? currenciesQuery.data.currencies
			: SUPPORTED_CURRENCIES;

	const pending = updateMutation.isPending;

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const values = { openingBalanceAmount: amount, openingBalanceCurrency: currency };
		const fieldErrors = fieldErrorsFromSchema(openingBalanceFormSchema, values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = openingBalanceFormSchema.parse(values);
		try {
			await updateMutation.mutateAsync({
				openingBalance: {
					amount: Number(parsed.openingBalanceAmount),
					currency: parsed.openingBalanceCurrency,
				},
			});
			toast.success('Starting balance saved');
			onSuccess();
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save starting balance.'));
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Starting Balance</DialogTitle>
				<DialogDescription>
					How much money do you have available to spend?
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="opening-balance-dialog-amount">Amount</Label>
					<div
						className={cn(
							'flex h-10 overflow-hidden rounded-lg border border-input/20 bg-muted shadow-xs transition-[color,box-shadow]',
							'focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/30',
							(errors.openingBalanceAmount || errors.openingBalanceCurrency) &&
								'border-destructive ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20',
						)}
					>
						<Input
							id="opening-balance-dialog-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							value={amount}
							onChange={(e) => {
								setAmount(e.target.value);
								if (errors.openingBalanceAmount) {
									setErrors((prev) => ({ ...prev, openingBalanceAmount: undefined }));
								}
							}}
							disabled={pending}
							aria-invalid={Boolean(errors.openingBalanceAmount)}
							className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 tabular-nums"
							data-testid="opening-balance-dialog-amount"
						/>
						<Select
							value={currency}
							onValueChange={(v) => {
								setCurrency(v);
								if (errors.openingBalanceCurrency) {
									setErrors((prev) => ({ ...prev, openingBalanceCurrency: undefined }));
								}
							}}
							disabled={pending || currenciesQuery.isLoading}
						>
							<SelectTrigger
								id="opening-balance-dialog-currency"
								aria-label="Starting balance currency"
								aria-invalid={Boolean(errors.openingBalanceCurrency)}
								className="h-full w-auto shrink-0 rounded-none border-0 border-l border-input/20 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0"
							>
								<SelectValue placeholder="Select currency" />
							</SelectTrigger>
							<SelectContent align="end">
								{currencyOptions.map((c) => (
									<SelectItem key={c.code} value={c.code}>
										{c.code}
										{c.symbol ? ` (${c.symbol})` : ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{errors.openingBalanceAmount ? (
						<p className="text-[10px] leading-tight text-destructive">
							{errors.openingBalanceAmount}
						</p>
					) : null}
					{errors.openingBalanceCurrency ? (
						<p className="text-[10px] leading-tight text-destructive">
							{errors.openingBalanceCurrency}
						</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="opening-balance-dialog-submit">
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
