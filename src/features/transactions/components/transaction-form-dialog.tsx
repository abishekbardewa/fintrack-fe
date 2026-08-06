import { useMemo, useState, type FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAppSelector } from '@/app/hooks';
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
import { selectUser } from '@/features/auth/authSlice';
import { useCategoriesQuery } from '@/features/categories/hooks/use-categories';
import { buildCategoryTree } from '@/features/categories/utils';
import { AutoGrowDescription } from '@/features/transactions/components/auto-grow-description';
import {
	useCreateTransactionMutation,
	useSuggestDescriptionsQuery,
	useUpdateTransactionMutation,
} from '@/features/transactions/hooks/use-transactions';
import {
	transactionFieldErrors,
	transactionFormSchema,
	type TransactionFormValues,
} from '@/features/transactions/schemas';
import type { Transaction } from '@/features/transactions/types';
import { dateInputToIso, todayDateInput, toDateInputValue } from '@/features/transactions/utils';
import { getErrorMessage } from '@/lib/api/errors';
import { DEFAULT_CURRENCY, SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { cn } from '@/lib/utils';

interface TransactionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction?: Transaction | null;
}

function emptyValues(defaultCurrency: string): TransactionFormValues {
	return {
		type: 'expense',
		amount: 0,
		currency: defaultCurrency as TransactionFormValues['currency'],
		categoryId: '',
		subcategoryId: '',
		description: '',
		date: todayDateInput(),
	};
}

function fromTransaction(tx: Transaction): TransactionFormValues {
	return {
		type: tx.type,
		amount: tx.amount,
		currency: tx.currency as TransactionFormValues['currency'],
		categoryId: tx.categoryId,
		subcategoryId: tx.subcategoryId ?? '',
		description: tx.description ?? '',
		date: toDateInputValue(tx.date),
	};
}

export function TransactionFormDialog({
	open,
	onOpenChange,
	transaction,
}: TransactionFormDialogProps) {
	const user = useAppSelector(selectUser);
	const defaultCurrency = user?.currency || DEFAULT_CURRENCY;
	const isEdit = Boolean(transaction);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
				{open ? (
					<TransactionFormFields
						key={transaction?.id ?? `new-${defaultCurrency}`}
						isEdit={isEdit}
						transaction={transaction}
						defaultCurrency={defaultCurrency}
						onClose={() => onOpenChange(false)}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface TransactionFormFieldsProps {
	isEdit: boolean;
	transaction?: Transaction | null;
	defaultCurrency: string;
	onClose: () => void;
}

function TransactionFormFields({
	isEdit,
	transaction,
	defaultCurrency,
	onClose,
}: TransactionFormFieldsProps) {
	const createMutation = useCreateTransactionMutation();
	const updateMutation = useUpdateTransactionMutation();
	const [values, setValues] = useState<TransactionFormValues>(() =>
		transaction ? fromTransaction(transaction) : emptyValues(defaultCurrency),
	);
	const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
	const [descFocused, setDescFocused] = useState(false);

	const { data: categoryData } = useCategoriesQuery(values.type);
	const tree = useMemo(
		() => buildCategoryTree(categoryData?.categories ?? []),
		[categoryData?.categories],
	);
	const selectedMain = tree.find((c) => c.id === values.categoryId);
	const subs = selectedMain?.children ?? [];

	const suggestionsQuery = useSuggestDescriptionsQuery(
		{
			categoryId: values.categoryId,
			subcategoryId: values.subcategoryId || undefined,
			type: values.type,
		},
		descFocused && Boolean(values.categoryId),
	);

	const pending = createMutation.isPending || updateMutation.isPending;

	const setField = <K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) {
			setErrors((prev) => ({ ...prev, [key]: undefined }));
		}
	};

	const handleTypeChange = (type: TransactionFormValues['type']) => {
		setValues((prev) => ({
			...prev,
			type,
			categoryId: '',
			subcategoryId: '',
		}));
		setErrors((prev) => ({
			...prev,
			type: undefined,
			categoryId: undefined,
			subcategoryId: undefined,
		}));
	};

	const handleCategoryChange = (categoryId: string) => {
		setValues((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
		setErrors((prev) => ({ ...prev, categoryId: undefined, subcategoryId: undefined }));
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const fieldErrors = transactionFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}

		const parsed = transactionFormSchema.parse(values);
		const payload = {
			type: parsed.type,
			amount: parsed.amount,
			currency: parsed.currency,
			categoryId: parsed.categoryId,
			subcategoryId: parsed.subcategoryId || null,
			description: parsed.description?.trim() || undefined,
			date: dateInputToIso(parsed.date),
		};

		try {
			if (isEdit && transaction) {
				await updateMutation.mutateAsync({ id: transaction.id, payload });
				toast.success('Transaction updated');
			} else {
				await createMutation.mutateAsync(payload);
				toast.success('Transaction added');
			}
			onClose();
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not save transaction.'));
		}
	};

	return (
		<form onSubmit={handleSubmit} noValidate className="grid gap-0">
			<DialogHeader className="gap-1 border-b border-border px-6 py-5 pr-12 text-left">
				<DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Update this ledger entry.' : 'Record a new manual entry.'}
				</DialogDescription>
			</DialogHeader>

			<div className="grid gap-5 px-6 py-5">
				<div
					className="grid grid-cols-2 rounded-lg bg-muted p-1"
					role="group"
					aria-label="Transaction type"
				>
					{(['expense', 'income'] as const).map((type) => {
						const active = values.type === type;
						return (
							<button
								key={type}
								type="button"
								disabled={pending}
								onClick={() => handleTypeChange(type)}
								className={cn(
									'rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors',
									active
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground',
								)}
								aria-pressed={active}
								data-testid={`tx-type-${type}`}
							>
								{type}
							</button>
						);
					})}
				</div>
				{errors.type ? <p className="-mt-3 text-sm text-destructive">{errors.type}</p> : null}

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="tx-amount">Amount</Label>
						<Input
							id="tx-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							placeholder="0.00"
							value={values.amount || ''}
							onChange={(e) =>
								setField('amount', e.target.value === '' ? 0 : Number(e.target.value))
							}
							disabled={pending}
							aria-invalid={Boolean(errors.amount)}
							className="tabular-nums"
						/>
						{errors.amount ? <p className="text-sm text-destructive">{errors.amount}</p> : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="tx-currency">Currency</Label>
						<Select
							value={values.currency}
							onValueChange={(v) => setField('currency', v as TransactionFormValues['currency'])}
							disabled={pending}
						>
							<SelectTrigger
								id="tx-currency"
								className="w-full"
								aria-invalid={Boolean(errors.currency)}
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{SUPPORTED_CURRENCIES.map((c) => (
									<SelectItem key={c.code} value={c.code}>
										{c.code} ({c.symbol})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.currency ? (
							<p className="text-sm text-destructive">{errors.currency}</p>
						) : null}
					</div>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<div className="grid gap-2">
						<Label htmlFor="tx-category">Category</Label>
						<Select
							value={values.categoryId || undefined}
							onValueChange={handleCategoryChange}
							disabled={pending}
						>
							<SelectTrigger
								id="tx-category"
								className="w-full"
								aria-invalid={Boolean(errors.categoryId)}
							>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{tree.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.categoryId ? (
							<p className="text-sm text-destructive">{errors.categoryId}</p>
						) : null}
					</div>
					<div className="grid gap-2">
						<Label htmlFor="tx-subcategory">Subcategory</Label>
						<Select
							value={values.subcategoryId || '__none__'}
							onValueChange={(v) => setField('subcategoryId', v === '__none__' ? '' : v)}
							disabled={pending || !values.categoryId || subs.length === 0}
						>
							<SelectTrigger id="tx-subcategory" className="w-full">
								<SelectValue placeholder={subs.length ? 'Optional' : 'No subcategories'} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{subs.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="tx-description">Description (Optional)</Label>
					<AutoGrowDescription
						id="tx-description"
						value={values.description ?? ''}
						onChange={(v) => setField('description', v)}
						onFocus={() => setDescFocused(true)}
						onBlur={() => setDescFocused(false)}
						disabled={pending}
						invalid={Boolean(errors.description)}
					/>
					{errors.description ? (
						<p className="text-sm text-destructive">{errors.description}</p>
					) : null}
					{suggestionsQuery.data?.descriptions?.length ? (
						<div className="flex flex-wrap gap-2">
							{suggestionsQuery.data.descriptions.map((text) => (
								<button
									key={text}
									type="button"
									className={cn(
										'rounded-full border border-border px-2.5 py-1 text-xs transition-colors',
										values.description === text
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'bg-muted text-foreground hover:bg-accent',
									)}
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => setField('description', text.slice(0, 500))}
								>
									{text}
								</button>
							))}
						</div>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label htmlFor="tx-date">Date</Label>
					<DatePicker
						id="tx-date"
						value={values.date}
						onChange={(v) => setField('date', v)}
						disabled={pending}
						invalid={Boolean(errors.date)}
						aria-label="Transaction date"
					/>
					{errors.date ? <p className="text-sm text-destructive">{errors.date}</p> : null}
				</div>
			</div>

			<DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-end">
				<Button type="button" variant="outline" onClick={onClose} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending} data-testid="transaction-form-submit">
					{pending ? (
						<>
							<Loader2 className="animate-spin" />
							Saving…
						</>
					) : (
						<>
							<Check className="size-4" />
							{isEdit ? 'Save Changes' : 'Save Transaction'}
						</>
					)}
				</Button>
			</DialogFooter>
		</form>
	);
}
