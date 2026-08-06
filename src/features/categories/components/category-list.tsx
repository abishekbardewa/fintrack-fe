import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category, CategoryTreeNode } from '@/features/categories/types';

interface CategoryListProps {
	tree: CategoryTreeNode[];
	onAddSub: (parent: Category) => void;
	onRename: (category: Category) => void;
	onDelete: (category: Category) => void;
}

export function CategoryList({ tree, onAddSub, onRename, onDelete }: CategoryListProps) {
	return (
		<ul className="divide-y divide-border rounded-lg border border-border bg-card">
			{tree.map((main) => (
				<li key={main.id} className="p-3 sm:p-4">
					<div className="flex items-center gap-2">
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-foreground">{main.name}</p>
							<p className="text-xs text-muted-foreground">
								{main.children.length} subcategor{main.children.length === 1 ? 'y' : 'ies'}
							</p>
						</div>
						<CategoryActions
							showAddSub
							onAddSub={() => onAddSub(main)}
							onRename={() => onRename(main)}
							onDelete={() => onDelete(main)}
						/>
					</div>

					{main.children.length > 0 ? (
						<ul className="mt-3 space-y-1 border-l border-border pl-3 sm:pl-4">
							{main.children.map((sub) => (
								<li
									key={sub.id}
									className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60"
								>
									<span className="min-w-0 flex-1 truncate text-sm text-foreground">
										{sub.name}
									</span>
									<CategoryActions
										showAddSub={false}
										onRename={() => onRename(sub)}
										onDelete={() => onDelete(sub)}
									/>
								</li>
							))}
						</ul>
					) : null}
				</li>
			))}
		</ul>
	);
}

interface CategoryActionsProps {
	showAddSub: boolean;
	onAddSub?: () => void;
	onRename: () => void;
	onDelete: () => void;
}

function CategoryActions({ showAddSub, onAddSub, onRename, onDelete }: CategoryActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="ghost" size="icon-sm" aria-label="Category actions">
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{showAddSub && onAddSub ? (
					<DropdownMenuItem onClick={onAddSub}>
						<Plus />
						Add subcategory
					</DropdownMenuItem>
				) : null}
				<DropdownMenuItem onClick={onRename}>
					<Pencil />
					Rename
				</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
