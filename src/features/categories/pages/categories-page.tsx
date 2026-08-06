import { CategoryKindPanel } from '@/features/categories/components/category-kind-panel';

export function CategoriesPage() {
	return (
		<div className="flex flex-col gap-8">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Organize income and expense into mains and one level of subcategories.
				</p>
			</header>

			<CategoryKindPanel kind="expense" />
			<CategoryKindPanel kind="income" />
		</div>
	);
}
