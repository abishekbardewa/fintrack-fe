import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { selectUser } from '@/features/auth/authSlice';
import { CategoryFormDialog } from '@/features/categories/components/category-form-dialog';
import {
	categoryKeys,
	useCategoriesQuery,
	useCreateCategoryMutation,
} from '@/features/categories/hooks/use-categories';
import type { CategoriesListData, Category } from '@/features/categories/types';
import {
	MAX_MAIN_CATEGORIES_PER_KIND,
	MAX_SUBCATEGORIES_PER_PARENT,
} from '@/features/categories/types';
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

type CategoryCreateMode = 'main' | 'sub';

const ADD_ITEM_CLASS =
	'relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50';

function appendCategory(
	old: CategoriesListData | undefined,
	category: Category,
): CategoriesListData {
	if (!old) return { categories: [category] };
	if (old.categories.some((item) => item.id === category.id)) return old;
	return { categories: [...old.categories, category] };
}

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
	const createCategoryMutation = useCreateCategoryMutation();
	const queryClient = useQueryClient();
	const [values, setValues] = useState<TransactionFormValues>(() =>
		transaction ? fromTransaction(transaction) : emptyValues(defaultCurrency),
	);
	const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormValues, string>>>({});
	const [descFocused, setDescFocused] = useState(false);
	const [categoryCreateMode, setCategoryCreateMode] = useState<CategoryCreateMode | null>(null);
	const [categorySelectOpen, setCategorySelectOpen] = useState(false);
	const [subcategorySelectOpen, setSubcategorySelectOpen] = useState(false);
	const createModeRef = useRef<CategoryCreateMode | null>(null);
	const pendingCategoryIdRef = useRef<string | null>(null);
	const pendingSubcategoryIdRef = useRef<string | null>(null);

	const { data: categoryData } = useCategoriesQuery(values.type);
	const tree = useMemo(
		() => buildCategoryTree(categoryData?.categories ?? []),
		[categoryData?.categories],
	);
	const selectedMain = tree.find((c) => c.id === values.categoryId);
	const subs = selectedMain?.children ?? [];
	const mainAtCap = tree.length >= MAX_MAIN_CATEGORIES_PER_KIND;
	const subAtCap = subs.length >= MAX_SUBCATEGORIES_PER_PARENT;

	useEffect(() => {
		const pendingCategoryId = pendingCategoryIdRef.current;
		if (pendingCategoryId && tree.some((main) => main.id === pendingCategoryId)) {
			setValues((prev) => ({
				...prev,
				categoryId: pendingCategoryId,
				subcategoryId: '',
			}));
			setErrors((prev) => ({
				...prev,
				categoryId: undefined,
				subcategoryId: undefined,
			}));
			pendingCategoryIdRef.current = null;
		}

		const pendingSubcategoryId = pendingSubcategoryIdRef.current;
		if (
			pendingSubcategoryId &&
			tree.some((main) => main.children.some((sub) => sub.id === pendingSubcategoryId))
		) {
			setValues((prev) => ({ ...prev, subcategoryId: pendingSubcategoryId }));
			setErrors((prev) => ({ ...prev, subcategoryId: undefined }));
			pendingSubcategoryIdRef.current = null;
		}
	}, [tree]);

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

	const openCategoryCreate = (mode: CategoryCreateMode) => {
		createModeRef.current = mode;
		setCategorySelectOpen(false);
		setSubcategorySelectOpen(false);
		setTimeout(() => setCategoryCreateMode(mode), 0);
	};

	const handleCategoryChange = (categoryId: string) => {
		pendingCategoryIdRef.current = null;
		pendingSubcategoryIdRef.current = null;
		setValues((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
		setErrors((prev) => ({ ...prev, categoryId: undefined, subcategoryId: undefined }));
	};

	const handleSubcategoryChange = (subcategoryId: string) => {
		pendingSubcategoryIdRef.current = null;
		setField('subcategoryId', subcategoryId === '__none__' ? '' : subcategoryId);
	};

	const cacheCreatedCategory = (category: Category) => {
		queryClient.setQueryData(categoryKeys.list(values.type), (old: CategoriesListData | undefined) =>
			appendCategory(old, category),
		);
		queryClient.setQueryData(categoryKeys.list(), (old: CategoriesListData | undefined) =>
			appendCategory(old, category),
		);
	};

	const handleCategoryCreate = async (name: string) => {
		const mode = createModeRef.current ?? categoryCreateMode;
		if (!mode) return;

		try {
			if (mode === 'main') {
				const data = await createCategoryMutation.mutateAsync({
					name,
					kind: values.type,
				});
				const created = data.category;
				if (!created?.id) {
					throw new Error('Category created without an id.');
				}
				pendingCategoryIdRef.current = created.id;
				pendingSubcategoryIdRef.current = null;
				cacheCreatedCategory(created);
				setValues((prev) => ({
					...prev,
					categoryId: created.id,
					subcategoryId: '',
				}));
				setErrors((prev) => ({
					...prev,
					categoryId: undefined,
					subcategoryId: undefined,
				}));
				toast.success('Category created');
			} else {
				const parentId = values.categoryId;
				if (!parentId) return;
				const data = await createCategoryMutation.mutateAsync({
					name,
					kind: values.type,
					parentCategoryId: parentId,
				});
				const created = data.category;
				if (!created?.id) {
					throw new Error('Subcategory created without an id.');
				}
				pendingSubcategoryIdRef.current = created.id;
				cacheCreatedCategory(created);
				setValues((prev) => ({ ...prev, subcategoryId: created.id }));
				setErrors((prev) => ({ ...prev, subcategoryId: undefined }));
				toast.success('Subcategory created');
			}
			createModeRef.current = null;
			setCategoryCreateMode(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not create category.'));
		}
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
		<>
			<form onSubmit={handleSubmit} noValidate className="grid gap-0">
			<DialogHeader className="gap-1 border-b border-border px-6 py-5 pr-12 text-left">
				<DialogTitle>{isEdit ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
				<DialogDescription>
					{isEdit ? 'Fix this entry.' : 'Log what came in or went out.'}
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
				{errors.type ? (
					<p className="-mt-3 text-[10px] leading-tight text-destructive">{errors.type}</p>
				) : null}

				<div className="grid gap-2">
					<Label htmlFor="tx-amount">Amount</Label>
					<div
						className={cn(
							'flex h-10 overflow-hidden rounded-lg border border-input/20 bg-muted shadow-xs transition-[color,box-shadow]',
							'focus-within:border-primary/50 focus-within:ring-[3px] focus-within:ring-primary/30',
							(errors.amount || errors.currency) &&
								'border-destructive ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20',
						)}
					>
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
							className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0 tabular-nums"
						/>
						<Select
							value={values.currency}
							onValueChange={(v) => setField('currency', v as TransactionFormValues['currency'])}
							disabled={pending}
						>
							<SelectTrigger
								id="tx-currency"
								aria-label="Currency"
								aria-invalid={Boolean(errors.currency)}
								className="h-full w-auto shrink-0 rounded-none border-0 border-l border-input/20 bg-transparent px-3 shadow-none focus-visible:border-transparent focus-visible:ring-0"
								data-testid="tx-currency"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								{SUPPORTED_CURRENCIES.map((c) => (
									<SelectItem key={c.code} value={c.code}>
										{c.code} ({c.symbol})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					{errors.amount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
					) : null}
					{errors.currency ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.currency}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<div className="grid items-start gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="tx-category">Category</Label>
							<Select
								key={values.categoryId || 'category-empty'}
								open={categorySelectOpen}
								onOpenChange={setCategorySelectOpen}
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
									<SelectSeparator />
									<button
										type="button"
										className={ADD_ITEM_CLASS}
										disabled={mainAtCap}
										data-testid="tx-add-category"
										onPointerDown={(event) => event.preventDefault()}
										onClick={() => {
											if (!mainAtCap) openCategoryCreate('main');
										}}
									>
										{mainAtCap ? 'Add category (max reached)' : 'Add category…'}
									</button>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="tx-subcategory">Subcategory</Label>
							<Select
								key={values.subcategoryId || 'subcategory-empty'}
								open={subcategorySelectOpen}
								onOpenChange={setSubcategorySelectOpen}
								value={values.subcategoryId || '__none__'}
								onValueChange={handleSubcategoryChange}
								disabled={pending || !values.categoryId}
							>
								<SelectTrigger id="tx-subcategory" className="w-full">
									<SelectValue placeholder="Optional" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">None</SelectItem>
									{subs.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
									<SelectSeparator />
									<button
										type="button"
										className={ADD_ITEM_CLASS}
										disabled={subAtCap}
										data-testid="tx-add-subcategory"
										onPointerDown={(event) => event.preventDefault()}
										onClick={() => {
											if (values.categoryId && !subAtCap) openCategoryCreate('sub');
										}}
									>
										{subAtCap
											? 'Add subcategory (max reached)'
											: 'Add subcategory…'}
									</button>
								</SelectContent>
							</Select>
						</div>
					</div>
					{errors.categoryId ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.categoryId}</p>
					) : null}
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
						<p className="text-[10px] leading-tight text-destructive">{errors.description}</p>
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
					{errors.date ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.date}</p>
					) : null}
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

			<CategoryFormDialog
				open={categoryCreateMode != null}
				onOpenChange={(open) => {
					if (!open) setCategoryCreateMode(null);
				}}
				title={
					categoryCreateMode === 'sub'
						? `Add under ${selectedMain?.name ?? 'category'}`
						: `Add ${values.type} category`
				}
				description={
					categoryCreateMode === 'sub'
						? `Nested under ${selectedMain?.name ?? 'this category'}.`
						: 'Give it a name.'
				}
				confirmLabel={categoryCreateMode === 'sub' ? 'Add subcategory' : 'Add category'}
				pending={createCategoryMutation.isPending}
				onSubmit={handleCategoryCreate}
			/>
		</>
	);
}
