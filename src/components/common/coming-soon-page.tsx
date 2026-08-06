import type { LucideIcon } from 'lucide-react';

interface ComingSoonPageProps {
	title: string;
	description: string;
	icon?: LucideIcon;
}

export function ComingSoonPage({ title, description, icon: Icon }: ComingSoonPageProps) {
	return (
		<div className="flex min-h-[calc(100svh-8rem)] flex-col gap-6 md:min-h-[calc(100svh-7rem)]">
			<header className="flex items-start gap-3">
				{Icon ? (
					<span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
						<Icon className="size-5" aria-hidden="true" />
					</span>
				) : null}
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				</div>
			</header>

			<div className="flex flex-1 items-center justify-center">
				<p className="text-sm text-muted-foreground">Coming soon</p>
			</div>
		</div>
	);
}
