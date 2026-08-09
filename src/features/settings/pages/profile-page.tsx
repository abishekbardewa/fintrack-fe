import { useAppSelector } from '@/app/hooks';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { selectUser } from '@/features/auth/authSlice';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { useMeQuery } from '@/features/settings/hooks/use-profile';

export function ProfilePage() {
	const storedUser = useAppSelector(selectUser);
	const { data, isLoading, isError, refetch } = useMeQuery();
	const user = data?.user ?? storedUser;

	return (
		<div className="flex flex-col gap-6">
			<header>
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
				<p className="mt-1 text-sm text-muted-foreground">Your account details.</p>
			</header>

			{isLoading && !user ? (
				<Skeleton className="h-80 w-full max-w-lg rounded-lg" />
			) : null}

			{isError && !user ? (
				<ErrorState
					title="Could not load profile"
					description="Check your connection and try again."
					onRetry={() => void refetch()}
				/>
			) : null}

			{user ? (
				<section className="max-w-lg rounded-lg border border-border bg-card p-4 shadow-xs sm:p-6">
					<ProfileForm user={user} />
				</section>
			) : null}
		</div>
	);
}
