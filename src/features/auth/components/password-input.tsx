import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<React.ComponentProps<'input'>, 'type'> {
	label: string;
	error?: string;
}

export function PasswordInput({ label, error, id, className, disabled, ...props }: PasswordInputProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const errorId = `${inputId}-error`;
	const [visible, setVisible] = useState(false);

	return (
		<div className="grid gap-2">
			<Label htmlFor={inputId}>{label}</Label>
			<div className="relative">
				<Input
					id={inputId}
					type={visible ? 'text' : 'password'}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? errorId : undefined}
					className={cn('pr-10', className)}
					disabled={disabled}
					{...props}
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					onClick={() => setVisible((v) => !v)}
					disabled={disabled}
					aria-label={visible ? 'Hide password' : 'Show password'}
				>
					{visible ? <EyeOff /> : <Eye />}
				</Button>
			</div>
			{error ? (
				<p id={errorId} className="text-sm text-destructive" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
