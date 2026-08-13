import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from '@/features/categories/category.service';
import type {
	CategoriesListData,
	CategoryKind,
	CategoryMutationData,
	CreateCategoryRequest,
	UpdateCategoryRequest,
} from '@/features/categories/types';
import { dashboardKeys } from '@/features/dashboard/hooks/use-dashboard';
import { trendsKeys } from '@/features/trends/hooks/use-trends';

export const categoryKeys = {
	all: ['categories'] as const,
	list: (kind?: CategoryKind) => [...categoryKeys.all, 'list', kind ?? 'all'] as const,
};

export function useCategoriesQuery(kind?: CategoryKind) {
	return useQuery({
		queryKey: categoryKeys.list(kind),
		queryFn: () => listCategories(kind),
	});
}

function invalidateCategoryConsumers(queryClient: ReturnType<typeof useQueryClient>) {
	void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
	void queryClient.invalidateQueries({ queryKey: trendsKeys.all });
}

function appendCategoryToList(
	old: CategoriesListData | undefined,
	category: CategoryMutationData['category'],
): CategoriesListData {
	if (!old) return { categories: [category] };
	if (old.categories.some((item) => item.id === category.id)) return old;
	return { categories: [...old.categories, category] };
}

export function useCreateCategoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
		onSuccess: (data, variables) => {
			queryClient.setQueryData(
				categoryKeys.list(variables.kind),
				(old: CategoriesListData | undefined) => appendCategoryToList(old, data.category),
			);
			queryClient.setQueryData(
				categoryKeys.list(),
				(old: CategoriesListData | undefined) => appendCategoryToList(old, data.category),
			);
			invalidateCategoryConsumers(queryClient);
		},
	});
}

export function useUpdateCategoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryRequest; kind: CategoryKind }) =>
			updateCategory(id, payload),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({ queryKey: categoryKeys.list(variables.kind) });
			invalidateCategoryConsumers(queryClient);
		},
	});
}

export function useDeleteCategoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }: { id: string; kind: CategoryKind }) => deleteCategory(id),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({ queryKey: categoryKeys.list(variables.kind) });
			invalidateCategoryConsumers(queryClient);
		},
	});
}
