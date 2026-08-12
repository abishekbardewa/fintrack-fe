import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/brand/brand-mark';

interface AuthLayoutProps {
	title: string;
	panelHeadline: React.ReactNode;
	panelDescription: string;
	children: React.ReactNode;
	footer: React.ReactNode;
}

export function AuthLayout({
	title,
	panelHeadline,
	panelDescription,
	children,
	footer,
}: AuthLayoutProps) {
	return (
		<div className="relative flex min-h-svh w-full overflow-y-auto overflow-x-clip bg-background text-foreground lg:h-svh lg:overflow-hidden">
			<main className="relative z-10 flex w-full flex-col lg:h-full lg:flex-row">
				<section className="relative hidden w-1/2 flex-col justify-center px-12 py-12 xl:px-20 auth-mesh lg:flex">
					<div
						className="pointer-events-none absolute inset-0 opacity-[0.06]"
						style={{
							backgroundImage:
								'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
							backgroundSize: '80px 80px',
						}}
						aria-hidden="true"
					/>
					<div className="relative z-10 flex max-w-lg flex-col gap-6">
						<BrandMark />
						<div className="flex flex-col gap-3">
							<h1 className="text-5xl font-extrabold tracking-tighter text-foreground xl:text-6xl xl:leading-[1.05]">
								{panelHeadline}
							</h1>
							<p className="text-base text-muted-foreground">{panelDescription}</p>
						</div>
						<p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
							Clarity · Budgets · Goals
						</p>
					</div>
				</section>

				<section className="flex w-full flex-1 flex-col items-center justify-center gap-6 bg-muted px-6 py-8 sm:px-10 lg:w-1/2 lg:gap-0 lg:px-12 lg:py-12">
					<div className="w-full max-w-md lg:hidden">
						<BrandMark />
					</div>

					<div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/20 bg-card p-6 shadow-[0_20px_40px_rgba(0,64,161,0.04)] sm:p-8 dark:border-border/10 dark:shadow-none">
						<div className="primary-gradient absolute top-0 left-0 h-1 w-full" aria-hidden="true" />
						<header className="mb-6">
							<h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
						</header>

						{children}

						<div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
					</div>
				</section>
			</main>
		</div>
	);
}

interface AuthLinkProps {
	to: string;
	children: React.ReactNode;
}

export function AuthLink({ to, children }: AuthLinkProps) {
	return (
		<Link to={to} className="font-semibold text-primary underline-offset-4 hover:underline">
			{children}
		</Link>
	);
}
