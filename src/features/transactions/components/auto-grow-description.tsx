import { useLayoutEffect, useRef } from 'react';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const DESCRIPTION_MAX = 500;

interface AutoGrowDescriptionProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	disabled?: boolean;
	invalid?: boolean;
	placeholder?: string;
	className?: string;
}

export function AutoGrowDescription({
	id,
	value,
	onChange,
	onFocus,
	onBlur,
	disabled,
	invalid,
	placeholder = 'What was this for?',
	className,
}: AutoGrowDescriptionProps) {
	const ref = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.height = '0px';
		const next = Math.min(Math.max(el.scrollHeight, 64), 128);
		el.style.height = `${next}px`;
	}, [value]);

	return (
		<div className="grid gap-1.5">
			<Textarea
				ref={ref}
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value.slice(0, DESCRIPTION_MAX))}
				onFocus={onFocus}
				onBlur={onBlur}
				disabled={disabled}
				placeholder={placeholder}
				aria-invalid={invalid}
				rows={2}
				className={cn(
					'min-h-16 max-h-32 resize-none overflow-y-auto field-sizing-fixed',
					className,
				)}
				data-testid="tx-description"
			/>
			<p className="text-right text-xs tabular-nums text-muted-foreground" aria-live="polite">
				{value.length}/{DESCRIPTION_MAX}
			</p>
		</div>
	);
}

export { DESCRIPTION_MAX };
