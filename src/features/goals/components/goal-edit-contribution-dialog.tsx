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
	contributionFieldErrors,
	contributionFormSchema,
	spendFromGoalFieldErrors,
	spendFromGoalFormSchema,
	type ContributionFormValues,
	type SpendFromGoalFormValues,
} from '@/features/goals/schemas';
import type { GoalContribution, UpdateContributionRequest } from '@/features/goals/types';
import { toDateInputValue } from '@/features/goals/utils';
import { dateInputToIso } from '@/features/transactions/utils';
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

interface GoalEditContributionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contribution: GoalContribution | null;
	goalName: string;
	preferredCurrency: string;
	maxAvailable?: number;
	maxGoalBalance?: number;
	pending?: boolean;
	onSubmit: (payload: UpdateContributionRequest) => Promise<void> | void;
}

export function GoalEditContributionDialog({
	open,
	onOpenChange,
	contribution,
	goalName,
	preferredCurrency,
	maxAvailable,
	maxGoalBalance,
	pending = false,
	onSubmit,
}: GoalEditContributionDialogProps) {
	const isSpend = contribution?.source === 'goal_spend';

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				{open && contribution ? (
					isSpend ? (
						<SpendEditFields
							key={contribution.id}
							contribution={contribution}
							goalName={goalName}
							preferredCurrency={preferredCurrency}
							maxGoalBalance={maxGoalBalance}
							pending={pending}
							onCancel={() => onOpenChange(false)}
							onSubmit={onSubmit}
						/>
					) : (
						<EditFormFields
							key={contribution.id}
							contribution={contribution}
							goalName={goalName}
							preferredCurrency={preferredCurrency}
							maxAvailable={maxAvailable}
							maxGoalBalance={maxGoalBalance}
							pending={pending}
							onCancel={() => onOpenChange(false)}
							onSubmit={onSubmit}
						/>
					)
				) : null}
			</DialogContent>
		</Dialog>
	);
}

interface EditFormFieldsProps {
	contribution: GoalContribution;
	goalName: string;
	preferredCurrency: string;
	maxAvailable?: number;
	maxGoalBalance?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalEditContributionDialogProps['onSubmit'];
}

function EditFormFields({
	contribution,
	goalName,
	preferredCurrency,
	maxAvailable,
	maxGoalBalance,
	pending,
	onCancel,
	onSubmit,
}: EditFormFieldsProps) {
	const originalAmount = Math.abs(contribution.amountPreferred ?? contribution.amount);
	const isReturn = contribution.source === 'return_to_available';
	const isStarting = contribution.source === 'starting_balance';
	const [values, setValues] = useState<ContributionFormValues>(() => ({
		amount: String(originalAmount),
		date: toDateInputValue(contribution.date),
		note: contribution.note ?? '',
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
		const amount = Number(parsed.amount);
		if (isReturn && maxGoalBalance != null && amount > maxGoalBalance + originalAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the goal balance' }));
			return;
		}
		if (!isReturn && !isStarting && maxAvailable != null && amount > originalAmount) {
			const extra = amount - originalAmount;
			if (extra > maxAvailable) {
				setErrors((prev) => ({ ...prev, amount: 'Amount exceeds Spendable Money' }));
				return;
			}
		}
		await onSubmit({
			amount,
			currency: preferredCurrency,
			date: dateInputToIso(parsed.date),
			note: parsed.note.trim() || null,
		});
	};

	return (
		<form onSubmit={handleSubmit} noValidate>
			<DialogHeader>
				<DialogTitle>Edit</DialogTitle>
				<DialogDescription>Update this entry in “{goalName}”.</DialogDescription>
			</DialogHeader>

			<div className="grid gap-4 py-4">
				<div className="grid gap-2">
					<Label htmlFor="edit-contrib-amount">Amount</Label>
					<Input
						id="edit-contrib-amount"
						type="number"
						inputMode="decimal"
						min="0"
						step="any"
						value={values.amount}
						onChange={(e) => setField('amount', e.target.value)}
						className="tabular-nums"
						disabled={pending}
						aria-invalid={Boolean(errors.amount)}
					/>
					{errors.amount ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<Label>Date</Label>
					<DatePicker
						value={values.date}
						onChange={(v) => setField('date', v)}
						disabled={pending}
						invalid={Boolean(errors.date)}
						aria-label="Date"
					/>
					{errors.date ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.date}</p>
					) : null}
				</div>

				<div className="grid gap-2">
					<GoalNoteLabel htmlFor="edit-contrib-note" />
					<Input
						id="edit-contrib-note"
						value={values.note}
						onChange={(e) => setField('note', e.target.value)}
						disabled={pending}
						aria-invalid={Boolean(errors.note)}
					/>
					{errors.note ? (
						<p className="text-[10px] leading-tight text-destructive">{errors.note}</p>
					) : null}
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
					Cancel
				</Button>
				<Button type="submit" disabled={pending}>
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

interface SpendEditFieldsProps {
	contribution: GoalContribution;
	goalName: string;
	preferredCurrency: string;
	maxGoalBalance?: number;
	pending: boolean;
	onCancel: () => void;
	onSubmit: GoalEditContributionDialogProps['onSubmit'];
}

function SpendEditFields({
	contribution,
	goalName,
	preferredCurrency,
	maxGoalBalance,
	pending,
	onCancel,
	onSubmit,
}: SpendEditFieldsProps) {
	const createCategoryMutation = useCreateCategoryMutation();
	const queryClient = useQueryClient();
	const { data: categoryData } = useCategoriesQuery('expense');
	const tree = useMemo(
		() => buildCategoryTree(categoryData?.categories ?? []),
		[categoryData?.categories],
	);
	const originalAmount = Math.abs(contribution.amountPreferred ?? contribution.amount);
	const [values, setValues] = useState<SpendFromGoalFormValues>(() => ({
		amount: String(originalAmount),
		categoryId: contribution.categoryId ?? '',
		subcategoryId: contribution.subcategoryId ?? '',
		description: contribution.description ?? '',
		date: toDateInputValue(contribution.date),
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

	useEffect(() => {
		const pendingCategoryId = pendingCategoryIdRef.current;
		if (pendingCategoryId && tree.some((main) => main.id === pendingCategoryId)) {
			setValues((prev) => ({
				...prev,
				categoryId: pendingCategoryId,
				subcategoryId: '',
			}));
			pendingCategoryIdRef.current = null;
		}
		const pendingSubcategoryId = pendingSubcategoryIdRef.current;
		if (
			pendingSubcategoryId &&
			tree.some((main) => main.children.some((sub) => sub.id === pendingSubcategoryId))
		) {
			setValues((prev) => ({ ...prev, subcategoryId: pendingSubcategoryId }));
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
				if (!created?.id) throw new Error('Category created without an id.');
				pendingCategoryIdRef.current = created.id;
				cacheCreatedCategory(created);
				setValues((prev) => ({ ...prev, categoryId: created.id, subcategoryId: '' }));
				toast.success('Category created');
			} else {
				if (!values.categoryId) return;
				const data = await createCategoryMutation.mutateAsync({
					name,
					kind: 'expense',
					parentCategoryId: values.categoryId,
				});
				const created = data.category;
				if (!created?.id) throw new Error('Subcategory created without an id.');
				pendingSubcategoryIdRef.current = created.id;
				cacheCreatedCategory(created);
				setValues((prev) => ({ ...prev, subcategoryId: created.id }));
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
		if (maxGoalBalance != null && amount > maxGoalBalance + originalAmount) {
			setErrors((prev) => ({ ...prev, amount: 'Amount exceeds the goal balance' }));
			return;
		}
		await onSubmit({
			amount,
			currency: preferredCurrency,
			date: dateInputToIso(parsed.date),
			categoryId: parsed.categoryId,
			subcategoryId: parsed.subcategoryId || null,
			description: parsed.description.trim() || null,
		});
	};

	const busy = pending || createCategoryMutation.isPending;

	return (
		<>
			<form onSubmit={handleSubmit} noValidate>
				<DialogHeader>
					<DialogTitle>Edit</DialogTitle>
					<DialogDescription>Update this entry in “{goalName}”.</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="edit-spend-amount">Amount</Label>
						<Input
							id="edit-spend-amount"
							type="number"
							inputMode="decimal"
							min="0"
							step="any"
							value={values.amount}
							onChange={(e) => setField('amount', e.target.value)}
							className="tabular-nums"
							disabled={busy}
							aria-invalid={Boolean(errors.amount)}
						/>
						{errors.amount ? (
							<p className="text-[10px] leading-tight text-destructive">{errors.amount}</p>
						) : null}
					</div>

					<div className="grid items-start gap-4 sm:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="edit-spend-category">Category</Label>
							<Select
								key={values.categoryId || 'category-empty'}
								open={categorySelectOpen}
								onOpenChange={setCategorySelectOpen}
								value={values.categoryId || undefined}
								onValueChange={(categoryId) => {
									setValues((prev) => ({ ...prev, categoryId, subcategoryId: '' }));
									setErrors((prev) => ({ ...prev, categoryId: undefined }));
								}}
								disabled={busy}
							>
								<SelectTrigger
									id="edit-spend-category"
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
							<Label htmlFor="edit-spend-subcategory">Subcategory</Label>
							<Select
								key={values.subcategoryId || 'subcategory-empty'}
								open={subcategorySelectOpen}
								onOpenChange={setSubcategorySelectOpen}
								value={values.subcategoryId || '__none__'}
								onValueChange={(v) => setField('subcategoryId', v === '__none__' ? '' : v)}
								disabled={busy || !values.categoryId}
							>
								<SelectTrigger id="edit-spend-subcategory" className="w-full">
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
						<GoalNoteLabel htmlFor="edit-spend-description" />
						<Input
							id="edit-spend-description"
							value={values.description}
							onChange={(e) => setField('description', e.target.value)}
							disabled={busy}
						/>
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
					</div>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
						Cancel
					</Button>
					<Button type="submit" disabled={busy}>
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
