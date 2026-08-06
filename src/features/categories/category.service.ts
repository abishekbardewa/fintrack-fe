import { apiPrivate } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import type { ApiResponse } from '@/lib/api/types';
import type {
	CategoriesListData,
	CategoryKind,
	CategoryMutationData,
	CreateCategoryRequest,
	UpdateCategoryRequest,
} from '@/features/categories/types';

const CATEGORIES_BASE = '/categories';

function unwrapData<T>(body: ApiResponse<T>, fallbackMessage: string): T {
	if (!body.success || body.data == null) {
		throw new ApiError(
			body.message || fallbackMessage,
			body.statusCode ?? 0,
			body.success === false ? body.details : undefined,
		);
	}
	return body.data;
}

export async function listCategories(kind?: CategoryKind) {
	const { data } = await apiPrivate.get<ApiResponse<CategoriesListData>>(CATEGORIES_BASE, {
		params: kind ? { kind } : undefined,
	});
	return unwrapData(data, 'Failed to load categories.');
}

export async function createCategory(payload: CreateCategoryRequest) {
	const body: CreateCategoryRequest = {
		name: payload.name,
		kind: payload.kind,
	};
	if (payload.parentCategoryId) {
		body.parentCategoryId = payload.parentCategoryId;
	}

	const { data } = await apiPrivate.post<ApiResponse<CategoryMutationData>>(CATEGORIES_BASE, body);
	return unwrapData(data, 'Failed to create category.');
}

export async function updateCategory(id: string, payload: UpdateCategoryRequest) {
	const { data } = await apiPrivate.patch<ApiResponse<CategoryMutationData>>(
		`${CATEGORIES_BASE}/${id}`,
		payload,
	);
	return unwrapData(data, 'Failed to update category.');
}

export async function deleteCategory(id: string) {
	const { data } = await apiPrivate.delete<ApiResponse<null>>(`${CATEGORIES_BASE}/${id}`);
	if (data.success === false) {
		throw new ApiError(
			data.message || 'Failed to delete category.',
			data.statusCode ?? 0,
			data.details,
		);
	}
}
