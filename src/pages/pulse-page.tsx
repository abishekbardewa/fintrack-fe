import { Activity } from 'lucide-react';

import { useAppSelector } from '@/app/hooks';
import { selectUser } from '@/features/auth/authSlice';

export function PulsePage() {
	const user = useAppSelector(selectUser);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-3">
				<span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Activity className="size-5" aria-hidden="true" />
				</span>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pulse</h1>
					<p className="text-sm text-muted-foreground">
						{user?.name ? `Welcome back, ${user.name}` : 'Your daily and weekly snapshot'}
					</p>
				</div>
			</div>
			<p className="mt-4 text-muted-foreground">
				Dashboard metrics and recent activity will live here. Use the sidebar or bottom nav to
				explore the rest of the app shell.
			</p>
		</div>
	);
}
