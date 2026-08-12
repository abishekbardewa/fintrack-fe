import { Pencil, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Category, CategoryKind, CategoryTreeNode } from '@/features/categories/types';
import { cn } from '@/lib/utils';

interface CategoryListProps {
	kind: CategoryKind;
	tree: CategoryTreeNode[];
	onAddMain: () => void;
	onAddSub: (parent: Category) => void;
	onRename: (category: Category) => void;
	onDelete: (category: Category) => void;
}

export function CategoryList({
	kind,
	tree,
	onAddMain,
	onAddSub,
	onRename,
	onDelete,
}: CategoryListProps) {
	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
			data-testid="category-list"
		>
			<button
				type="button"
				onClick={onAddMain}
				className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border/70 bg-muted/50 text-muted-foreground shadow-sm transition-colors hover:border-border hover:bg-muted hover:text-foreground"
				data-testid="category-add-main-card"
			>
				<span className="inline-flex size-8 items-center justify-center rounded-full bg-card shadow-sm">
					<Plus className="size-4" aria-hidden="true" />
				</span>
				<span className="text-sm font-medium">
					Add {kind === 'income' ? 'income' : 'expense'} category
				</span>
			</button>

			{tree.map((main) => (
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

function IconAction({
	label,
	onClick,
	tone = 'default',
	children,
}: {
	label: string;
	onClick: () => void;
	tone?: 'default' | 'danger';
	children: React.ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					aria-label={label}
					className={cn(
						'rounded-full bg-card shadow-sm hover:bg-card/90',
						tone === 'danger' && 'hover:bg-destructive/10 hover:text-destructive',
					)}
					onClick={onClick}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent sideOffset={6}>{label}</TooltipContent>
		</Tooltip>
	);
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
	const KindIcon = isIncome ? TrendingUp : TrendingDown;
	const hasSubs = main.children.length > 0;

	return (
		<article
			className="relative flex min-h-44 flex-col overflow-hidden rounded-3xl bg-muted shadow-sm"
			data-testid={`category-main-${main.id}`}
		>
			<div className="flex items-start gap-3 px-5 pt-5 pb-3">
				<div
					className={cn(
						'flex size-6 shrink-0 items-center justify-center rounded-full',
						isIncome ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense',
					)}
				>
					<KindIcon className="size-3" aria-hidden="true" />
				</div>
				<div className="min-w-0 flex-1 pt-0.5">
					<h3 className="truncate text-sm font-semibold text-foreground">{main.name}</h3>
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<IconAction label="Rename" onClick={onRename}>
						<Pencil className="size-3" />
					</IconAction>
					<IconAction label="Delete" onClick={onDelete} tone="danger">
						<Trash2 className="size-3" />
					</IconAction>
				</div>
			</div>

			{hasSubs ? (
				<div className="flex flex-1 flex-wrap content-start gap-1.5 px-5 pb-5">
					{main.children.map((sub) => (
						<Badge
							key={sub.id}
							variant="secondary"
							className="max-w-full gap-0.5 bg-card px-2 py-1 text-[11px] leading-none text-foreground shadow-sm"
							data-testid={`category-sub-${sub.id}`}
						>
							<span className="truncate">{sub.name}</span>
							<button
								type="button"
								className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
								aria-label={`Rename ${sub.name}`}
								onClick={() => onRenameSub(sub)}
							>
								<Pencil className="size-2.5" aria-hidden="true" />
							</button>
							<button
								type="button"
								className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
								aria-label={`Delete ${sub.name}`}
								onClick={() => onDeleteSub(sub)}
							>
								<Trash2 className="size-2.5" aria-hidden="true" />
							</button>
						</Badge>
					))}
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label="Add subcategory"
								onClick={onAddSub}
								className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-card/90"
							>
								<Plus className="size-3" aria-hidden="true" />
							</button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>Add subcategory</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 pb-5">
					<p className="text-xs text-muted-foreground">No subcategory</p>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label="Add subcategory"
								onClick={onAddSub}
								className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-sm hover:bg-card/90"
							>
								<Plus className="size-3" aria-hidden="true" />
							</button>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>Add subcategory</TooltipContent>
					</Tooltip>
				</div>
			)}
		</article>
	);
}
