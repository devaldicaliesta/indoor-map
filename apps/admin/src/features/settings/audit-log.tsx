import { AUDIT_ACTIONS, AUDIT_LOG_LIMIT, type AuditAction } from '@indoor/domain';
import {
  EmptyState,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@indoor/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { data } from '../../app/data-client';
import { AUDIT_LABELS, describeAuditDetails } from './audit-format';

const ALL = 'all';

const timeFormat = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function AuditLog() {
  const [action, setAction] = useState<AuditAction | typeof ALL>(ALL);
  const events = useQuery({
    queryKey: ['audit', action],
    queryFn: () => data.audit.listRecent(action === ALL ? undefined : action),
  });

  return (
    <div className="grid gap-4">
      <div className="flex items-end gap-4">
        <div className="grid w-64 gap-1">
          <Label htmlFor="audit-action">Aksi</Label>
          <Select value={action} onValueChange={(v) => setAction(v as AuditAction | typeof ALL)}>
            <SelectTrigger id="audit-action">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua aksi</SelectItem>
              {AUDIT_ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {AUDIT_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 text-ink-muted text-sm">
          {AUDIT_LOG_LIMIT} peristiwa terakhir, terbaru di atas.
        </p>
      </div>

      {events.isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : events.error ? (
        <p className="text-danger">{events.error.message}</p>
      ) : events.data.length === 0 ? (
        <EmptyState
          title="Belum ada peristiwa"
          description="Peristiwa seperti masuk, perubahan role, dan perubahan pengaturan akan tercatat di sini."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Keterangan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.data.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono tabular-nums">
                  {timeFormat.format(new Date(event.occurredAt))}
                </TableCell>
                <TableCell className={event.action === 'login_failed' ? 'text-danger' : undefined}>
                  {AUDIT_LABELS[event.action]}
                </TableCell>
                <TableCell>
                  {event.actor ? (
                    <>
                      {event.actor.name}{' '}
                      <span className="font-mono text-ink-muted text-xs">{event.actor.email}</span>
                    </>
                  ) : (
                    <span className="text-ink-muted">Sistem</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-normal text-ink-muted">
                  {describeAuditDetails(event)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
