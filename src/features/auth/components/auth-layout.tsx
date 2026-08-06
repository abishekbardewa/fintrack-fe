import { Link } from 'react-router-dom';

interface AuthLayoutProps {
	title: string;
	subtitle: string;
	children: React.ReactNode;
	footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
	return (
		<div className="flex min-h-svh w-full bg-background text-foreground">
			<section className="flex min-h-svh w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-16">
				<div className="mb-8 lg:hidden">
					<p className="text-xl font-semibold tracking-tight text-foreground">FinTRACK</p>
					<p className="text-xs text-muted-foreground">Personal finance, clearly</p>
				</div>

				<div className="mx-auto w-full max-w-[400px]">
					<header className="mb-8">
						<p className="mb-6 hidden text-lg font-semibold tracking-tight text-foreground lg:block">
							FinTRACK
						</p>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
							{title}
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
					</header>

					{children}

					<div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
				</div>
			</section>

			<aside
				className="relative hidden min-h-svh items-center justify-center bg-muted lg:flex lg:w-1/2"
				aria-hidden="true"
			>
				<img
					src="/login.svg"
					alt=""
					className="max-h-[min(28rem,55vh)] w-full max-w-md object-contain px-12 opacity-90"
				/>
			</aside>
		</div>
	);
}

interface AuthLinkProps {
	to: string;
	children: React.ReactNode;
}

export function AuthLink({ to, children }: AuthLinkProps) {
	return (
		<Link to={to} className="font-medium text-primary underline-offset-4 hover:underline">
			{children}
		</Link>
	);
}
