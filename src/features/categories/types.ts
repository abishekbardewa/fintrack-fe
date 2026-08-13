export type CategoryKind = 'expense' | 'income';

export const MAX_MAIN_CATEGORIES_PER_KIND = 100;
export const MAX_SUBCATEGORIES_PER_PARENT = 100;

export interface Category {
	id: string;
	name: string;
	kind: CategoryKind;
	parentCategoryId: string | null;
	createdAt?: string;
	updatedAt?: string;
}

export interface CategoryTreeNode extends Category {
	children: Category[];
}

export interface CategoriesListData {
	categories: Category[];
}

export interface CategoryMutationData {
	category: Category;
}

export interface CreateCategoryRequest {
	name: string;
	kind: CategoryKind;
	parentCategoryId?: string | null;
}

export interface UpdateCategoryRequest {
	name: string;
}
