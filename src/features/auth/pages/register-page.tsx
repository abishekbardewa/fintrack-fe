import { useActionState, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { AuthLayout, AuthLink } from '@/features/auth/components/auth-layout';
import { FormField } from '@/features/auth/components/form-field';
import { PasswordInput } from '@/features/auth/components/password-input';
import { registerUser } from '@/features/auth/auth.service';
import { setCredentials } from '@/features/auth/authSlice';
import { homePathForUser } from '@/features/auth/utils';
import {
	formDataToObject,
	registerSchema,
	zodFieldErrors,
	type RegisterFormValues,
} from '@/features/auth/schemas';
import { getErrorMessage, getFieldErrors, toApiError } from '@/lib/api/errors';
import { DEFAULT_CURRENCY, getBrowserTimezone, SUPPORTED_CURRENCIES } from '@/lib/currencies';

type RegisterActionState = {
	fieldErrors: Partial<Record<keyof RegisterFormValues, string>>;
	values: RegisterFormValues;
	revision: number;
};

const initialState: RegisterActionState = {
	fieldErrors: {},
	values: {
		name: '',
		email: '',
		password: '',
		currency: DEFAULT_CURRENCY,
	},
	revision: 0,
};

const REGISTER_FIELDS = ['name', 'email', 'password', 'currency'] as const;

export function RegisterPage() {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

	const [state, formAction, isPending] = useActionState(
		async (prev: RegisterActionState, formData: FormData): Promise<RegisterActionState> => {
			const raw = formDataToObject(formData) as RegisterFormValues;
			setCurrency(raw.currency || DEFAULT_CURRENCY);

			const fieldErrors = zodFieldErrors(registerSchema, raw);
			if (Object.keys(fieldErrors).length > 0) {
				return { fieldErrors, values: raw, revision: prev.revision + 1 };
			}

			const parsed = registerSchema.parse(raw);
			try {
				const data = await registerUser({
					...parsed,
					timezone: getBrowserTimezone(),
				});
				dispatch(
					setCredentials({
						user: data.user,
						accessToken: data.accessToken,
					}),
				);
				toast.success('Account created');
				navigate(homePathForUser(data.user), { replace: true });
				return {
					fieldErrors: {},
					values: { name: '', email: '', password: '', currency: parsed.currency },
					revision: prev.revision + 1,
				};
			} catch (error) {
				const apiError = toApiError(error, 'Registration failed. Please try again.');
				const apiFieldErrors = getFieldErrors(error, REGISTER_FIELDS);

				if (Object.keys(apiFieldErrors).length > 0) {
					return { fieldErrors: apiFieldErrors, values: raw, revision: prev.revision + 1 };
				}

				if (apiError.statusCode === 429) {
					toast.error('Too many requests. Please try again later.');
				} else if (apiError.statusCode === 409) {
					toast.error(apiError.message || 'An account with this email already exists.');
				} else {
					toast.error(getErrorMessage(error, 'Registration failed. Please try again.'));
				}

				return { fieldErrors: {}, values: raw, revision: prev.revision + 1 };
			}
		},
		initialState,
	);

	const currencyErrorId = 'register-currency-error';

	return (
		<AuthLayout
			title="Create account"
			subtitle="Begin your journey to financial clarity."
			panelHeadline={
				<>
					Design your
					<br />
					<span className="text-primary">wealth.</span>
				</>
			}
			panelDescription="Join FinTrack to orchestrate budgets, goals, and spending in one elegant place."
			footer={
				<>
					Already have an account? <AuthLink to="/login">Log in</AuthLink>
				</>
			}
		>
			<form
				key={state.revision}
				action={formAction}
				noValidate
				className="grid gap-4"
				data-testid="register-form"
			>
				<FormField
					label="Name"
					id="register-name"
					name="name"
					type="text"
					autoComplete="name"
					placeholder="Your name"
					defaultValue={state.values.name}
					error={state.fieldErrors.name}
					disabled={isPending}
				/>
				<FormField
					label="Email"
					id="register-email"
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
					id="register-password"
					name="password"
					autoComplete="new-password"
					placeholder="Create a password"
					defaultValue={state.values.password}
					error={state.fieldErrors.password}
					disabled={isPending}
				/>
				<div className="grid gap-2">
					<Label htmlFor="register-currency">Currency</Label>
					<input type="hidden" name="currency" value={currency} />
					<Select value={currency} onValueChange={setCurrency} disabled={isPending}>
						<SelectTrigger
							id="register-currency"
							className="w-full"
							aria-invalid={Boolean(state.fieldErrors.currency)}
							aria-describedby={state.fieldErrors.currency ? currencyErrorId : undefined}
						>
							<SelectValue placeholder="Select currency" />
						</SelectTrigger>
						<SelectContent position="popper">
							{SUPPORTED_CURRENCIES.map((item) => (
								<SelectItem key={item.code} value={item.code}>
									{item.code} — {item.name} ({item.symbol})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{state.fieldErrors.currency ? (
						<p id={currencyErrorId} className="text-[10px] leading-tight text-destructive" role="alert">
							{state.fieldErrors.currency}
						</p>
					) : null}
				</div>
				<Button
					type="submit"
					size="lg"
					className="mt-1 w-full"
					disabled={isPending}
					data-testid="register-submit"
				>
					{isPending ? (
						<>
							<Loader2 className="animate-spin" />
							Creating account…
						</>
					) : (
						'Sign up'
					)}
				</Button>
			</form>
		</AuthLayout>
	);
}
