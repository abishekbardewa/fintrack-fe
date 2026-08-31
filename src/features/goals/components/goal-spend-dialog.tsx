import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
import { GoalNoteLabel } from '@/features/goals/components/goal-note-label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
import {
	spendFromGoalFieldErrors,
	spendFromGoalFormSchema,
	type SpendFromGoalFormValues,
} from '@/features/goals/schemas';
import type { SavingsGoal } from '@/features/goals/types';
import { todayDateInput, dateInputToIso } from '@/features/transactions/utils';
import { getErrorMessage } from '@/lib/api/errors';

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

interface GoalSpendDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	goal: SavingsGoal | null;
	preferredCurrency: string;
	pending?: boolean;
	onSubmit: (payload: {
		amount: number;
		currency: string;
		categoryId: string;
		subcategoryId?: string;
		description?: string;
		date: string;
	}) => Promise<void> | void;
}

export function GoalSpendDialog({
	open,
	onOpenChange,
	goal,
	preferredCurrency,
	pending = false,
	onSubmit,
}: GoalSpendDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && goal ? (
					<SpendFormFields
						key={goal.id}
						goal={goal}
						preferredCurrency={preferredCurrency}
						pending={pending}
						onCancel={() => onOpenChange(false)}
						onSubmit={onSubmit}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface SpendFormFieldsProps {
	goal: SavingsGoal;
	preferredCurrency: string;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalSpendDialogProps['onSubmit'];
}

function SpendFormFields({
	goal,
	preferredCurrency,
	pending,
	onCancel,
	onSubmit,
}: SpendFormFieldsProps) {
	const createCategoryMutation = useCreateCategoryMutation();
	const queryClient = useQueryClient();
	const { data: categoryData } = useCategoriesQuery('expense');
	const tree = useMemo(
		() => buildCategoryTree(categoryData?.categories ?? []),
		[categoryData?.categories],
	);
	const [values, setValues] = useState<SpendFromGoalFormValues>(() => ({
		amount: '',
		categoryId: '',
		subcategoryId: '',
		description: '',
		date: todayDateInput(),
	}));
	const [errors, setErrors] = useState<
		Partial<Record<keyof SpendFromGoalFormValues, string>>
	>({});
	const [categoryCreateMode, setCategoryCreateMode] = useState<CategoryCreateMode | null>(
		null,
	);
	const [categorySelectOpen, setCategorySelectOpen] = useState(false);
	const [subcategorySelectOpen, setSubcategorySelectOpen] = useState(false);
	const createModeRef = useRef<CategoryCreateMode | null>(null);
	const pendingCategoryIdRef = useRef<string | null>(null);
	const pendingSubcategoryIdRef = useRef<string | null>(null);

	const selectedMain = tree.find((c) => c.id === values.categoryId);
	const subs = selectedMain?.children ?? [];
	const mainAtCap = tree.length >= MAX_MAIN_CATEGORIES_PER_KIND;
	const subAtCap = subs.length >= MAX_SUBCATEGORIES_PER_PARENT;
	const maxAmount = goal.currentAmount;

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

	const setField = <K extends keyof SpendFromGoalFormValues>(
		key: K,
		value: SpendFromGoalFormValues[K],
	) => {
		setValues((prev) => ({ ...prev, [key]: value }));
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
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
		queryClient.setQueryData(categoryKeys.list('expense'), (old: CategoriesListData | undefined) =>
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
					kind: 'expense',
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
					kind: 'expense',
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const fieldErrors = spendFromGoalFieldErrors(values);
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors);
			return;
		}
		const parsed = spendFromGoalFormSchema.parse(values);
		const amount = Number(parsed.amount);
		if (amount > maxAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the goal balance' }));
			return;
		}
		await onSubmit({
			amount,
			currency: preferredCurrency,
			categoryId: parsed.categoryId,
			subcategoryId: parsed.subcategoryId || undefined,
			description: parsed.description.trim() || undefined,
			date: dateInputToIso(parsed.date),
		});
	};

	const busy = pending || createCategoryMutation.isPending;

	return (
		<>
			<form onSubmit={handleSubmit} noValidate>
				<DialogHeader>
					<DialogTitle>Spend from Goal</DialogTitle>
					<DialogDescription>Record money spent from “{goal.name}”.</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="spend-amount">Amount</Label>
						<Input
							id="spend-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							value={values.amount}
							onChange={(e) => setField('amount', e.target.value)}
							placeholder="e.g. 1,000"
							className="tabular-nums"
							disabled={busy}
							aria-invalid={Boolean(errors.amount)}
							data-testid="goal-spend-amount"
						/>
						{errors.amount ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
						) : null}
					</div>

					<div className="grid items-start gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="spend-category">Category</Label>
							<Select
								key={values.categoryId || 'category-empty'}
								open={categorySelectOpen}
								onOpenChange={setCategorySelectOpen}
								value={values.categoryId || undefined}
								onValueChange={handleCategoryChange}
								disabled={busy}
							>
								<SelectTrigger
									id="spend-category"
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
							<Label htmlFor="spend-subcategory">Subcategory</Label>
							<Select
								key={values.subcategoryId || 'subcategory-empty'}
								open={subcategorySelectOpen}
								onOpenChange={setSubcategorySelectOpen}
								value={values.subcategoryId || '__none__'}
								onValueChange={handleSubcategoryChange}
								disabled={busy || !values.categoryId}
							>
								<SelectTrigger id="spend-subcategory" className="w-full">
									<SelectValue />
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
										onPointerDown={(event) => event.preventDefault()}
										onClick={() => {
											if (values.categoryId && !subAtCap) openCategoryCreate('sub');
										}}
									>
										{subAtCap ? 'Add subcategory (max reached)' : 'Add subcategory…'}
									</button>
								</SelectContent>
							</Select>
						</div>
					</div>
					{errors.categoryId ? (
						<p className="-mt-2 text-[10px] leading-tight text-destructive">
							{errors.categoryId}
						</p>
					) : null}

					<div className="grid gap-2">
						<GoalNoteLabel htmlFor="spend-description" />
						<Input
							id="spend-description"
							value={values.description}
							onChange={(e) => setField('description', e.target.value)}
							disabled={busy}
							aria-invalid={Boolean(errors.description)}
						/>
						{errors.description ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.description}</p>
						) : null}
					</div>

					<div className="grid gap-2">
						<Label>Date</Label>
						<DatePicker
							value={values.date}
							onChange={(v) => setField('date', v)}
							disabled={busy}
							invalid={Boolean(errors.date)}
							aria-label="Date"
						/>
						{errors.date ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.date}</p>
						) : null}
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
						Cancel
					</Button>
					<Button type="submit" disabled={busy} data-testid="goal-spend-submit">
						{pending ? (
							<>
								<Loader2 className="animate-spin" />
								Saving…
							</>
						) : (
							'Save Expense'
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
						: 'Add expense category'
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
