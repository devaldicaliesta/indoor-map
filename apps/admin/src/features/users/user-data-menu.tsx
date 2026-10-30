import { type Profile, userDataExportFilename } from '@indoor/domain';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toast,
} from '@indoor/ui';
import { MoreHorizontalIcon } from 'lucide-react';
import { useState } from 'react';
import { DeleteUserDialog } from './delete-user-dialog';
import { useExportUserData } from './queries';

function saveJson(value: unknown, filename: string) {
  const href = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Hak subjek data (UU PDP): export dan hapus data akun atas permintaan pemiliknya. */
export function UserDataMenu({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const exportData = useExportUserData();
  const [deleting, setDeleting] = useState(false);

  function download() {
    exportData.mutate(profile.userId, {
      onSuccess: (result) => {
        saveJson(result.document, userDataExportFilename(profile.email, result.exportedAt));
        toast.success(`Data akun ${profile.fullName} diunduh`);
      },
      onError: (error) => toast.error('Data akun tidak diekspor', { description: error.message }),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" aria-label={`Aksi data akun ${profile.fullName}`}>
            <MoreHorizontalIcon strokeWidth={1.75} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{profile.fullName}</DropdownMenuLabel>
          <DropdownMenuItem disabled={exportData.isPending} onSelect={download}>
            Ekspor data akun (JSON)
          </DropdownMenuItem>
          {isSelf ? null : (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger" onSelect={() => setDeleting(true)}>
                Hapus akun…
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {deleting ? <DeleteUserDialog profile={profile} onClose={() => setDeleting(false)} /> : null}
    </>
  );
}
