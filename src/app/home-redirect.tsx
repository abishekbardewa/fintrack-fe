import { Navigate } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated, selectUser } from '@/features/auth/authSlice';
import { homePathForUser } from '@/features/auth/utils';

export function HomeRedirect() {
	const isAuthenticated = useAppSelector(selectIsAuthenticated);
	const user = useAppSelector(selectUser);

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <Navigate to={homePathForUser(user)} replace />;
}
