import { useState } from 'react';
import { KeyRound, Settings, UserRound, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAppSelector } from '@/app/hooks';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { CurrencyForm } from '@/features/settings/components/currency-form';
import { ProfileDetailsForm } from '@/features/settings/components/profile-details-form';
import { useMeQuery } from '@/features/settings/hooks/use-profile';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'currency' | 'password';

const TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
	{ id: 'profile', label: 'Profile', icon: UserRound },
	{ id: 'currency', label: 'Preferred Currency', icon: Wallet },
	{ id: 'password', label: 'Password', icon: KeyRound },
];

export function SettingsPage() {
	const storedUser = useAppSelector(selectUser);
	const { data, isLoading, isError, refetch } = useMeQuery();
	const user = data?.user ?? storedUser;
	const [tab, setTab] = useState<SettingsTab>('profile');

	return (
		<div className="flex flex-col gap-6">
			<header className="flex items-start gap-3">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Settings className="size-5" aria-hidden="true" />
				</span>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage your account preferences and personalized experience.
					</p>
				</div>
			</header>

			{isLoading && !user ? (
				<div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
					<Skeleton className="h-40 w-full rounded-lg" />
					<Skeleton className="h-72 w-full rounded-lg" />
				</div>
			) : null}

			{isError && !user ? (
				<ErrorState
					title="Could not load profile"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{user ? (
				<div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6">
					<nav
						className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
						aria-label="Settings sections"
					>
						{TABS.map((item) => {
							const Icon = item.icon;
							const active = tab === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setTab(item.id)}
									className={cn(
										'flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors',
										active
											? 'bg-primary/10 text-primary lg:border-l-2 lg:border-primary lg:pl-[calc(0.75rem-2px)]'
											: 'text-muted-foreground hover:bg-muted hover:text-foreground',
									)}
									aria-current={active ? 'page' : undefined}
									data-testid={`settings-tab-${item.id}`}
								>
									<Icon className="size-4 shrink-0" aria-hidden="true" />
									{item.label}
								</button>
							);
						})}
					</nav>

					<section className="rounded-lg border border-border bg-card p-4 shadow-xs sm:p-6">
						{tab === 'profile' ? <ProfileDetailsForm user={user} /> : null}
						{tab === 'currency' ? <CurrencyForm user={user} /> : null}
						{tab === 'password' ? <ChangePasswordForm /> : null}
					</section>
				</div>
			) : null}
		</div>
	);
}
