import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';

import { HomeRedirect } from '@/app/home-redirect';
import { AppShell } from '@/components/layout/app-shell';
import {
	AdminRoute,
	GuestRoute,
	ProtectedRoute,
	UserRoute,
} from '@/features/auth/components/route-guards';
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { ExchangeRatesPage } from '@/features/admin-exchange-rates/pages/exchange-rates-page';
import { CategoriesPage } from '@/features/categories/pages/categories-page';
import { GoalsPage } from '@/features/goals/pages/goals-page';
import { BudgetsPage } from '@/features/budgets/pages/budgets-page';
import { ChangePasswordPage } from '@/features/settings/pages/change-password-page';
import { ProfilePage } from '@/features/settings/pages/profile-page';
import { TransactionsPage } from '@/features/transactions/pages/transactions-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { ReviewsPage } from '@/features/reviews/pages/reviews-page';
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
					{
						element: <UserRoute />,
						children: [
							{ path: '/dashboard', element: <DashboardPage /> },
							{ path: '/pulse', element: <Navigate to="/dashboard" replace /> },
							{ path: '/transactions', element: <TransactionsPage /> },
							{ path: '/budgets', element: <BudgetsPage /> },
							{ path: '/goals', element: <GoalsPage /> },
							{ path: '/categories', element: <CategoriesPage /> },
							{ path: '/trends', element: <TrendsPage /> },
							{ path: '/reviews', element: <ReviewsPage /> },
						],
					},
					{
						element: <AdminRoute />,
						children: [
							{ path: '/admin/exchange-rates', element: <ExchangeRatesPage /> },
						],
					},
					{ path: '/profile', element: <ProfilePage /> },
					{ path: '/change-password', element: <ChangePasswordPage /> },
					{ path: '/settings', element: <Navigate to="/profile" replace /> },
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
