import { useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Category, CategoryKind, CategoryTreeNode } from '@/features/categories/types';
import { cn } from '@/lib/utils';

/** Two rows × up to 4 columns on wide screens. */
const INITIAL_VISIBLE = 8;

interface CategoryListProps {
	kind: CategoryKind;
	tree: CategoryTreeNode[];
	onAddSub: (parent: Category) => void;
	onRename: (category: Category) => void;
	onDelete: (category: Category) => void;
}

export function CategoryList({
	kind,
	tree,
	onAddSub,
	onRename,
	onDelete,
}: CategoryListProps) {
	const [expanded, setExpanded] = useState(false);
	const needsMore = tree.length > INITIAL_VISIBLE;
	const visible = expanded || !needsMore ? tree : tree.slice(0, INITIAL_VISIBLE);

	return (
		<div className="space-y-3" data-testid="category-list">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{visible.map((main) => (
					<CategoryCard
						key={main.id}
						kind={kind}
						main={main}
						onAddSub={() => onAddSub(main)}
						onRename={() => onRename(main)}
						onDelete={() => onDelete(main)}
						onRenameSub={onRename}
						onDeleteSub={onDelete}
					/>
				))}
			</div>

			{needsMore ? (
				<button
					type="button"
					className="text-sm font-medium text-muted-foreground hover:text-foreground"
					onClick={() => setExpanded((open) => !open)}
					data-testid={`categories-show-more-${kind}`}
				>
					{expanded ? 'Show less' : `Show more (${tree.length - INITIAL_VISIBLE})`}
				</button>
			) : null}
		</div>
	);
}

interface CategoryCardProps {
	kind: CategoryKind;
	main: CategoryTreeNode;
	onAddSub: () => void;
	onRename: () => void;
	onDelete: () => void;
	onRenameSub: (category: Category) => void;
	onDeleteSub: (category: Category) => void;
}

function CategoryCard({
	kind,
	main,
	onAddSub,
	onRename,
	onDelete,
	onRenameSub,
	onDeleteSub,
}: CategoryCardProps) {
	const isIncome = kind === 'income';

	return (
		<article
			className={cn(
				'relative flex min-h-[11rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs',
				isIncome
					? 'bg-gradient-to-br from-emerald-500/12 via-card to-card'
					: 'bg-gradient-to-br from-rose-500/12 via-card to-card',
			)}
			data-testid={`category-main-${main.id}`}
		>
			<div className="flex items-start gap-3 border-b border-border/70 px-4 py-3">
				<div className="min-w-0 flex-1 pt-0.5">
					<h3 className="truncate text-sm font-semibold text-foreground">{main.name}</h3>
				</div>
				<CategoryActions
					showAddSub
					onAddSub={onAddSub}
					onRename={onRename}
					onDelete={onDelete}
				/>
			</div>

			<div className="flex flex-1 flex-col px-4 py-3">
				{main.children.length > 0 ? (
					<ul className="space-y-1.5">
						{main.children.map((sub) => (
							<li
								key={sub.id}
								className="group/sub flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-background/60"
								data-testid={`category-sub-${sub.id}`}
							>
								<span className="min-w-0 flex-1 truncate text-sm text-muted-foreground group-hover/sub:text-foreground">
									{sub.name}
								</span>
								<div className="opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover/sub:opacity-100 sm:focus-within:opacity-100">
									<CategoryActions
										showAddSub={false}
										onRename={() => onRenameSub(sub)}
										onDelete={() => onDeleteSub(sub)}
									/>
								</div>
							</li>
						))}
					</ul>
				) : (
					<button
						type="button"
						className="mt-auto text-left text-xs font-medium text-muted-foreground hover:text-foreground"
						onClick={onAddSub}
					>
						+ Add subcategory
					</button>
				)}
			</div>
		</article>
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
