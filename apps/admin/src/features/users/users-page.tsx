import {
  APP_ROLES,
  canInviteUsers,
  invitableRoles,
  type ModuleAccess,
  type Profile,
} from '@indoor/domain';
import {
  Button,
  type DataColumn,
  DataTable,
  EmptyState,
  type FilterDef,
  queryRows,
  StatusDot,
  toast,
} from '@indoor/ui';
import { useCurrentProfile } from '../../app/auth/current-profile';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { ROLE_LABELS } from '../../app/navigation';
import { useTableState } from '../../hooks/use-table-state';
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

type UserState = 'aktif' | 'terkunci' | 'nonaktif';

function userState(profile: Profile): UserState {
  if (!profile.isActive) return 'nonaktif';
  return lockedUntilText(profile) ? 'terkunci' : 'aktif';
}

const FILTERS: FilterDef[] = [
  {
    kind: 'multi',
    key: 'role',
    label: 'Role',
    options: APP_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
  },
  {
    kind: 'multi',
    key: 'status',
    label: 'Status',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'terkunci', label: 'Terkunci' },
      { value: 'nonaktif', label: 'Nonaktif' },
    ],
  },
];

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

/** `read`: Admin venue melihat anggota venue-nya tanpa mengubah role atau status. */
function UsersTable({ access }: { access: ModuleAccess }) {
  const users = useUsers();
  const me = useCurrentProfile().data;
  const update = useUpdateUser();
  const table = useTableState({ filters: FILTERS });

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

  const result = users.data
    ? queryRows(users.data, table.state, {
        text: (profile) => [profile.fullName, profile.email],
        filters: {
          role: (profile, values) => values.includes(profile.role),
          status: (profile, values) => values.includes(userState(profile)),
        },
      })
    : undefined;

  const editable = access === 'edit';
  const columns: DataColumn<Profile>[] = [
    {
      id: 'name',
      header: 'Nama',
      className: 'font-bold',
      cell: (profile) => (
        <>
          {profile.fullName}
          {profile.userId === me?.userId ? (
            <span className="ml-2 font-normal text-ink-muted text-xs">(Anda)</span>
          ) : null}
        </>
      ),
    },
    { id: 'email', header: 'Email', className: 'font-mono', cell: (profile) => profile.email },
    {
      id: 'role',
      header: 'Role',
      cell: (profile) =>
        editable ? (
          <RoleSelect
            label={`Role ${profile.fullName}`}
            value={profile.role}
            disabled={!profile.isActive}
            onChange={(role) => change(profile, { role }, `Role ${profile.fullName} diubah.`)}
          />
        ) : (
          ROLE_LABELS[profile.role]
        ),
    },
    { id: 'status', header: 'Status', cell: (profile) => <UserStatus profile={profile} /> },
  ];
  if (editable) {
    columns.push({
      id: 'actions',
      header: 'Aksi',
      className: 'text-right',
      cell: (profile) => (
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
      ),
    });
  }

  return (
    <DataTable
      label="Pengguna"
      columns={columns}
      rows={result?.rows}
      rowKey={(profile) => profile.userId}
      total={result?.total ?? 0}
      table={table}
      search={{ placeholder: 'Cari nama atau email' }}
      filters={FILTERS}
      error={users.error?.message ?? null}
      onRetry={() => void users.refetch()}
      empty={
        <EmptyState
          title="Belum ada pengguna"
          description="Undang pengguna Admin lewat tombol Tambah pengguna."
        />
      }
    />
  );
}

export function UsersPage() {
  const me = useCurrentProfile().data;
  return (
    <ModuleRoute module="users">
      {(access) => (
        <ModulePage
          module="users"
          access={access}
          actions={
            me && canInviteUsers(me) ? <InviteUserDialog roles={invitableRoles(me)} /> : null
          }
        >
          <UsersTable access={access} />
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
