import type { Profile } from '@indoor/domain';
import {
  Button,
  Skeleton,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@indoor/ui';
import { useCurrentProfile } from '../../app/auth/current-profile';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { InviteUserDialog } from './invite-user-dialog';
import { useUpdateUser, useUsers } from './queries';
import { RoleSelect } from './role-select';

function lockedUntilText(profile: Profile): string | null {
  if (!profile.lockedUntil || new Date(profile.lockedUntil) <= new Date()) return null;
  return new Date(profile.lockedUntil).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function UserStatus({ profile }: { profile: Profile }) {
  const lockedUntil = lockedUntilText(profile);
  if (!profile.isActive) return <StatusDot tone="neutral">Nonaktif</StatusDot>;
  if (lockedUntil)
    return (
      <StatusDot tone="warn" hollow>
        Terkunci s.d. {lockedUntil}
      </StatusDot>
    );
  return <StatusDot tone="ok">Aktif</StatusDot>;
}

function UsersTable() {
  const users = useUsers();
  const me = useCurrentProfile().data;
  const update = useUpdateUser();

  function change(
    profile: Profile,
    patch: Parameters<typeof update.mutate>[0]['patch'],
    done: string,
  ) {
    update.mutate(
      { userId: profile.userId, patch },
      {
        onSuccess: () => toast.success(done),
        onError: (error) => toast.error('Perubahan tidak disimpan', { description: error.message }),
      },
    );
  }

  if (users.isPending) return <Skeleton className="h-40 w-full" />;
  if (users.error) return <p className="text-danger">{users.error.message}</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.data.map((profile) => (
          <TableRow key={profile.userId}>
            <TableCell className="font-bold">
              {profile.fullName}
              {profile.userId === me?.userId ? (
                <span className="ml-2 font-normal text-ink-muted text-xs">(Anda)</span>
              ) : null}
            </TableCell>
            <TableCell className="font-mono">{profile.email}</TableCell>
            <TableCell>
              <RoleSelect
                label={`Role ${profile.fullName}`}
                value={profile.role}
                disabled={!profile.isActive}
                onChange={(role) => change(profile, { role }, `Role ${profile.fullName} diubah.`)}
              />
            </TableCell>
            <TableCell>
              <UserStatus profile={profile} />
            </TableCell>
            <TableCell className="text-right">
              <Button
                size="sm"
                variant={profile.isActive ? 'secondary' : 'ghost'}
                onClick={() =>
                  change(
                    profile,
                    { isActive: !profile.isActive },
                    profile.isActive
                      ? `${profile.fullName} dinonaktifkan.`
                      : `${profile.fullName} diaktifkan kembali.`,
                  )
                }
              >
                {profile.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function UsersPage() {
  return (
    <ModuleRoute module="users">
      {(access) => (
        <ModulePage module="users" access={access} actions={<InviteUserDialog />}>
          <UsersTable />
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
