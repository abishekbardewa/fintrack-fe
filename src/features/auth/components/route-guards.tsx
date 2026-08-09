import { Navigate, Outlet } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectUser } from '@/features/auth/authSlice';
import { getUserRole, homePathForRole, homePathForUser } from '@/features/auth/utils';

export function ProtectedRoute() {
	const isAuthenticated = useAppSelector(selectIsAuthenticated);

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <Outlet />;
}

export function GuestRoute() {
	const isAuthenticated = useAppSelector(selectIsAuthenticated);
	const user = useAppSelector(selectUser);

	if (isAuthenticated) {
		return <Navigate to={homePathForUser(user)} replace />;
	}

	return <Outlet />;
}

export function UserRoute() {
	const user = useAppSelector(selectUser);
	const role = getUserRole(user);

	if (role === 'admin') {
		return <Navigate to={homePathForRole('admin')} replace />;
	}

	return <Outlet />;
}

export function AdminRoute() {
	const user = useAppSelector(selectUser);
	const role = getUserRole(user);

	if (role !== 'admin') {
		return <Navigate to={homePathForRole('user')} replace />;
	}

	return <Outlet />;
}
