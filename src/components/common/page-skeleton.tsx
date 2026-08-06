import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
	return (
		<div aria-busy="true" aria-label="Loading page" className="space-y-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-4 w-full max-w-md" />
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }, (_, index) => (
					<Skeleton className="h-32 rounded-lg" key={index} />
				))}
			</div>
			<Skeleton className="h-72 rounded-lg" />
		</div>
	);
}
