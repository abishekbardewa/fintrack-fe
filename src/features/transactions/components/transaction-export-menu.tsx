import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TransactionExportSelection } from '@/features/transactions/components/transaction-export-dialog';
import { EXPORT_PRESETS } from '@/features/transactions/utils';

interface TransactionExportMenuProps {
	filtersActive: boolean;
	onSelect: (selection: TransactionExportSelection) => void;
}

export function TransactionExportMenu({ filtersActive, onSelect }: TransactionExportMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button type="button" variant="outline" data-testid="transaction-export">
					<Download className="size-4" />
					Export
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-48">
				{EXPORT_PRESETS.map((preset) => (
					<DropdownMenuItem
						key={preset.value}
						onClick={() => onSelect({ kind: 'preset', preset: preset.value })}
						data-testid={`transaction-export-${preset.value}`}
					>
						<div className="flex flex-col gap-0.5">
							<span>{preset.label}</span>
							<span className="text-xs text-muted-foreground">{preset.hint}</span>
						</div>
					</DropdownMenuItem>
				))}
				{filtersActive ? (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onSelect({ kind: 'filtered' })}
							data-testid="transaction-export-filtered"
						>
							<div className="flex flex-col gap-0.5">
								<span>Export filtered</span>
								<span className="text-xs text-muted-foreground">Current list filters</span>
							</div>
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
