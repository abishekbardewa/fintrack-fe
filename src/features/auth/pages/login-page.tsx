import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { AuthLayout, AuthLink } from '@/features/auth/components/auth-layout';
import { FormField } from '@/features/auth/components/form-field';
import { PasswordInput } from '@/features/auth/components/password-input';
import { loginUser } from '@/features/auth/auth.service';
import { setCredentials } from '@/features/auth/authSlice';
import {
	formDataToObject,
	loginSchema,
	zodFieldErrors,
	type LoginFormValues,
} from '@/features/auth/schemas';
import { getErrorMessage, getFieldErrors, toApiError } from '@/lib/api/errors';

type LoginActionState = {
	fieldErrors: Partial<Record<keyof LoginFormValues, string>>;
	values: LoginFormValues;
	revision: number;
};

const initialState: LoginActionState = {
	fieldErrors: {},
	values: { email: '', password: '' },
	revision: 0,
};

const LOGIN_FIELDS = ['email', 'password'] as const;

export function LoginPage() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const [state, formAction, isPending] = useActionState(
		async (prev: LoginActionState, formData: FormData): Promise<LoginActionState> => {
			const raw = formDataToObject(formData) as LoginFormValues;
			const fieldErrors = zodFieldErrors(loginSchema, raw);
			if (Object.keys(fieldErrors).length > 0) {
				return { fieldErrors, values: raw, revision: prev.revision + 1 };
			}

			const parsed = loginSchema.parse(raw);
			try {
				const data = await loginUser(parsed);
				dispatch(
					setCredentials({
						user: data.user,
						accessToken: data.accessToken,
					}),
				);
				toast.success('Welcome back');
				navigate('/pulse', { replace: true });
				return {
					fieldErrors: {},
					values: { email: parsed.email, password: '' },
					revision: prev.revision + 1,
				};
			} catch (error) {
				const apiError = toApiError(error, 'Login failed. Please try again.');
				const apiFieldErrors = getFieldErrors(error, LOGIN_FIELDS);

				if (Object.keys(apiFieldErrors).length > 0) {
					return { fieldErrors: apiFieldErrors, values: raw, revision: prev.revision + 1 };
				}

				if (apiError.statusCode === 429) {
					toast.error('Too many requests. Please try again later.');
				} else {
					toast.error(getErrorMessage(error, 'Login failed. Please try again.'));
				}

				return { fieldErrors: {}, values: raw, revision: prev.revision + 1 };
			}
		},
		initialState,
	);

	return (
		<AuthLayout
			title="Log in"
			subtitle="Welcome back. Pick up where you left off."
			panelHeadline={
				<>
					Track your
					<br />
					<span className="text-primary">money.</span>
				</>
			}
			panelDescription="Sign in to keep budgets, goals, and spending in one clear place."
			footer={
				<>
					Don&apos;t have an account? <AuthLink to="/register">Sign up</AuthLink>
				</>
			}
		>
			<form
				key={state.revision}
				action={formAction}
				noValidate
				className="grid gap-4"
				data-testid="login-form"
			>
				<FormField
					label="Email"
					id="login-email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@example.com"
					defaultValue={state.values.email}
					error={state.fieldErrors.email}
					disabled={isPending}
				/>
				<PasswordInput
					label="Password"
					id="login-password"
					name="password"
					autoComplete="current-password"
					placeholder="Your password"
					defaultValue={state.values.password}
					error={state.fieldErrors.password}
					disabled={isPending}
				/>
				<Button type="submit" size="lg" className="mt-2 w-full" disabled={isPending} data-testid="login-submit">
					{isPending ? (
						<>
							<Loader2 className="animate-spin" />
							Logging in…
						</>
					) : (
						'Log in'
					)}
				</Button>
			</form>
		</AuthLayout>
	);
}
