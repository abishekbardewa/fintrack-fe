import { useMemo, useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryDeleteDialog } from '@/features/categories/components/category-delete-dialog';
import { CategoryFormDialog } from '@/features/categories/components/category-form-dialog';
import { CategoryList } from '@/features/categories/components/category-list';
import {
	useCategoriesQuery,
	useCreateCategoryMutation,
	useDeleteCategoryMutation,
	useUpdateCategoryMutation,
} from '@/features/categories/hooks/use-categories';
import type { Category, CategoryKind } from '@/features/categories/types';
import { buildCategoryTree } from '@/features/categories/utils';
import { getErrorMessage } from '@/lib/api/errors';

type FormMode =
	| { type: 'create-main' }
	| { type: 'create-sub'; parent: Category }
	| { type: 'rename'; category: Category };

interface CategoryKindPanelProps {
	kind: CategoryKind;
}

export function CategoryKindPanel({ kind }: CategoryKindPanelProps) {
	const { data, isLoading, isError, refetch } = useCategoriesQuery(kind);
	const createMutation = useCreateCategoryMutation();
	const updateMutation = useUpdateCategoryMutation();
	const deleteMutation = useDeleteCategoryMutation();

	const [formMode, setFormMode] = useState<FormMode | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

	const tree = useMemo(
		() => buildCategoryTree(data?.categories ?? []),
		[data?.categories],
	);

	const formOpen = formMode != null;
	const formPending = createMutation.isPending || updateMutation.isPending;
	const kindLabel = kind === 'expense' ? 'Expense' : 'Income';
	const addLabel = `New ${kindLabel} Category`;

	const formTitle =
		formMode?.type === 'create-main'
			? `Add ${kind} category`
			: formMode?.type === 'create-sub'
				? `Add subcategory under ${formMode.parent.name}`
				: formMode?.type === 'rename'
					? 'Rename category'
					: '';

	const formDescription =
		formMode?.type === 'create-main'
			? `Create a new ${kind} category.`
			: formMode?.type === 'create-sub'
				? 'Create a subcategory under this main category.'
				: 'Choose a new name for this category.';

	const formInitialName = formMode?.type === 'rename' ? formMode.category.name : '';
	const formConfirmLabel =
		formMode?.type === 'rename'
			? 'Save'
			: formMode?.type === 'create-sub'
				? 'Add subcategory'
				: 'Add category';

	const handleFormSubmit = async (name: string) => {
		if (!formMode) return;
		try {
			if (formMode.type === 'create-main') {
				await createMutation.mutateAsync({ name, kind });
				toast.success('Category created');
			} else if (formMode.type === 'create-sub') {
				await createMutation.mutateAsync({
					name,
					kind,
					parentCategoryId: formMode.parent.id,
				});
				toast.success('Subcategory created');
			} else {
				await updateMutation.mutateAsync({
					id: formMode.category.id,
					kind,
					payload: { name },
				});
				toast.success('Category renamed');
			}
			setFormMode(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Something went wrong. Please try again.'));
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteMutation.mutateAsync({ id: deleteTarget.id, kind });
			toast.success('Category deleted');
			setDeleteTarget(null);
		} catch (error) {
			toast.error(getErrorMessage(error, 'Could not delete category.'));
		}
	};

	return (
		<section className="space-y-3" data-testid={`categories-section-${kind}`}>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-base font-semibold tracking-tight">{kindLabel}</h2>
				<Button
					type="button"
					onClick={() => setFormMode({ type: 'create-main' })}
					data-testid={`add-main-category-${kind}`}
				>
					<Plus className="size-4" />
					{addLabel}
				</Button>
			</div>

			{isLoading ? (
				<div
					className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
					aria-busy="true"
					aria-label={`Loading ${kind} categories`}
				>
					<Skeleton className="h-44 w-full rounded-xl" />
					<Skeleton className="h-44 w-full rounded-xl" />
					<Skeleton className="h-44 w-full rounded-xl" />
					<Skeleton className="h-44 w-full rounded-xl" />
				</div>
			) : null}

			{isError ? (
				<ErrorState
					title={`Could not load ${kind} categories`}
					description="Check your connection and try again."
					onRetry={() => {
						void refetch();
					}}
				/>
			) : null}

			{!isLoading && !isError && tree.length === 0 ? (
				<EmptyState
					icon={FolderTree}
					title={`No ${kind} categories yet`}
					description="Add a main category to start organizing transactions."
					action={
						<Button type="button" onClick={() => setFormMode({ type: 'create-main' })}>
							<Plus className="size-4" />
							{addLabel}
						</Button>
					}
				/>
			) : null}

			{!isLoading && !isError && tree.length > 0 ? (
				<CategoryList
					kind={kind}
					tree={tree}
					onAddSub={(parent) => setFormMode({ type: 'create-sub', parent })}
					onRename={(category) => setFormMode({ type: 'rename', category })}
					onDelete={setDeleteTarget}
				/>
			) : null}

			<CategoryFormDialog
				open={formOpen}
				onOpenChange={(open) => {
					if (!open) setFormMode(null);
				}}
				title={formTitle}
				description={formDescription}
				confirmLabel={formConfirmLabel}
				initialName={formInitialName}
				pending={formPending}
				onSubmit={handleFormSubmit}
			/>

			<CategoryDeleteDialog
				open={deleteTarget != null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				categoryName={deleteTarget?.name ?? ''}
				pending={deleteMutation.isPending}
				onConfirm={() => {
					void handleDelete();
				}}
			/>
		</section>
	);
}
