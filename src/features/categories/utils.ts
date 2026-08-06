import type { Category, CategoryTreeNode } from '@/features/categories/types';

export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
	const mains = categories
		.filter((c) => c.parentCategoryId == null)
		.sort((a, b) => a.name.localeCompare(b.name));

	return mains.map((main) => ({
		...main,
		children: categories
			.filter((c) => c.parentCategoryId === main.id)
			.sort((a, b) => a.name.localeCompare(b.name)),
	}));
}
