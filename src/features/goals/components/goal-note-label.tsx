import { Label } from '@/components/ui/label';

interface GoalNoteLabelProps {
	htmlFor: string;
}

export function GoalNoteLabel({ htmlFor }: GoalNoteLabelProps) {
	return <Label htmlFor={htmlFor}>Note</Label>;
}
