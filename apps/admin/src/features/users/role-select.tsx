import { APP_ROLES, type AppRole } from '@indoor/domain';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@indoor/ui';
import { ROLE_LABELS } from '../../app/navigation';

export function RoleSelect({
  value,
  onChange,
  disabled,
  label,
  id,
}: {
  value: AppRole;
  onChange: (role: AppRole) => void;
  disabled?: boolean;
  label: string;
  id?: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as AppRole)}
      disabled={disabled ?? false}
    >
      <SelectTrigger aria-label={label} id={id} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {APP_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
