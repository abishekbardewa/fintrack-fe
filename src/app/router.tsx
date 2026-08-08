import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { HomeRedirect } from '@/app/home-redirect';
import { AppShell } from '@/components/layout/app-shell';
import { GuestRoute, ProtectedRoute } from '@/features/auth/components/route-guards';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { CategoriesPage } from '@/features/categories/pages/categories-page';
import { GoalsPage } from '@/features/goals/pages/goals-page';
import { BudgetsPage } from '@/features/budgets/pages/budgets-page';
import { SettingsPage } from '@/features/settings/pages/settings-page';
import { TransactionsPage } from '@/features/transactions/pages/transactions-page';
import { NotFoundPage } from '@/pages/not-found-page';
import {
	ImportExportPage,
	ReviewsPage,
} from '@/pages/placeholder-pages';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { TrendsPage } from '@/features/trends/pages/trends-page';

const router = createBrowserRouter([
	{
		path: '/',
		element: <HomeRedirect />,
	},
	{
		element: <GuestRoute />,
		children: [
			{ path: '/login', element: <LoginPage /> },
			{ path: '/register', element: <RegisterPage /> },
		],
	},
	{
		element: <ProtectedRoute />,
		children: [
			{
				element: <AppShell />,
				children: [
					{ path: '/dashboard', element: <DashboardPage /> },
					{ path: '/pulse', element: <Navigate to="/dashboard" replace /> },
					{ path: '/transactions', element: <TransactionsPage /> },
					{ path: '/budgets', element: <BudgetsPage /> },
					{ path: '/goals', element: <GoalsPage /> },
					{ path: '/categories', element: <CategoriesPage /> },
					{ path: '/trends', element: <TrendsPage /> },
					{ path: '/reviews', element: <ReviewsPage /> },
					{ path: '/import-export', element: <ImportExportPage /> },
					{ path: '/settings', element: <SettingsPage /> },
				],
			},
		],
	},
	{
		path: '*',
		element: <NotFoundPage />,
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
