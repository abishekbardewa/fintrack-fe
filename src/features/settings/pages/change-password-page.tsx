import { ChangePasswordForm } from '@/features/settings/components/change-password-form';

export function ChangePasswordPage() {
	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Change password</h1>
				<p className="mt-1 text-sm text-muted-foreground">Update your account password.</p>
			</header>

			<section className="max-w-lg rounded-lg border border-border bg-card p-4 shadow-xs sm:p-6">
				<ChangePasswordForm />
			</section>
		</div>
	);
}
