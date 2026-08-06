import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends React.ComponentProps<'input'> {
	label: string;
	error?: string;
}

export function FormField({ label, error, id, className, ...props }: FormFieldProps) {
	const generatedId = useId();
	const inputId = id ?? generatedId;
	const errorId = `${inputId}-error`;

	return (
		<div className="grid gap-2">
			<Label htmlFor={inputId}>{label}</Label>
			<Input
				id={inputId}
				aria-invalid={Boolean(error)}
				aria-describedby={error ? errorId : undefined}
				className={cn(className)}
				{...props}
			/>
			{error ? (
				<p id={errorId} className="text-sm text-destructive" role="alert">
					{error}
				</p>
			) : null}
		</div>
	);
}
