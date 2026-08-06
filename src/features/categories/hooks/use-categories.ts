import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createCategory,
	deleteCategory,
	listCategories,
	updateCategory,
} from '@/features/categories/category.service';
import type {
	CategoryKind,
	CreateCategoryRequest,
	UpdateCategoryRequest,
} from '@/features/categories/types';

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

export function useCreateCategoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (payload: CreateCategoryRequest) => createCategory(payload),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({ queryKey: categoryKeys.list(variables.kind) });
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
		},
	});
}

export function useDeleteCategoryMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id }: { id: string; kind: CategoryKind }) => deleteCategory(id),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({ queryKey: categoryKeys.list(variables.kind) });
		},
	});
}
