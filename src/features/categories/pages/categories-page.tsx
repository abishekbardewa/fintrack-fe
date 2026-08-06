import { FolderTree } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryKindPanel } from '@/features/categories/components/category-kind-panel';

export function CategoriesPage() {
	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<FolderTree className="size-5" aria-hidden="true" />
				</span>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categories</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Organize income and expense into mains and one level of subcategories.
					</p>
				</div>
			</header>

			<Tabs defaultValue="expense">
				<TabsList>
					<TabsTrigger value="expense" data-testid="categories-tab-expense">
						Expense
					</TabsTrigger>
					<TabsTrigger value="income" data-testid="categories-tab-income">
						Income
					</TabsTrigger>
				</TabsList>
				<TabsContent value="expense" className="mt-4">
					<CategoryKindPanel kind="expense" />
				</TabsContent>
				<TabsContent value="income" className="mt-4">
					<CategoryKindPanel kind="income" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
