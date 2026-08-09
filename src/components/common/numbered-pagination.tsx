import { Button } from '@/components/ui/button';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type PageToken = number | 'ellipsis';

function getPaginationItems(current: number, total: number, siblingCount = 1): PageToken[] {
	if (total <= 1) return total === 1 ? [1] : [];
	if (total <= 7) {
		return Array.from({ length: total }, (_, i) => i + 1);
	}

	const pages = new Set<number>();
	pages.add(1);
	pages.add(total);
	for (let i = current - siblingCount; i <= current + siblingCount; i += 1) {
		if (i >= 1 && i <= total) pages.add(i);
	}

	const sorted = [...pages].sort((a, b) => a - b);
	const items: PageToken[] = [];
	let prev = 0;
	for (const page of sorted) {
		if (prev > 0 && page - prev > 1) items.push('ellipsis');
		items.push(page);
		prev = page;
	}
	return items;
}

interface NumberedPaginationProps {
	page: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
	className?: string;
}

export function NumberedPagination({
	page,
	totalPages,
	onPageChange,
	disabled,
	className,
}: NumberedPaginationProps) {
	if (totalPages <= 1) return null;

	const items = getPaginationItems(page, totalPages);

	return (
		<Pagination className={cn('justify-end', className)}>
			<PaginationContent>
				<PaginationItem>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={disabled || page <= 1}
						onClick={() => onPageChange(page - 1)}
						aria-label="Go to previous page"
						data-testid="pagination-prev"
					>
						Previous
					</Button>
				</PaginationItem>

				{items.map((item, index) =>
					item === 'ellipsis' ? (
						<PaginationItem key={`ellipsis-${index}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item}>
							<Button
								type="button"
								variant={item === page ? 'outline' : 'ghost'}
								size="icon"
								disabled={disabled}
								aria-current={item === page ? 'page' : undefined}
								aria-label={`Go to page ${item}`}
								onClick={() => onPageChange(item)}
								data-testid={`pagination-page-${item}`}
							>
								{item}
							</Button>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						disabled={disabled || page >= totalPages}
						onClick={() => onPageChange(page + 1)}
						aria-label="Go to next page"
						data-testid="pagination-next"
					>
						Next
					</Button>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
