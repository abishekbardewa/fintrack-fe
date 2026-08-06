import { Navigate } from 'react-router-dom';

import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';

export function HomeRedirect() {
	const isAuthenticated = useAppSelector(selectIsAuthenticated);
	return <Navigate to={isAuthenticated ? '/pulse' : '/login'} replace />;
}
