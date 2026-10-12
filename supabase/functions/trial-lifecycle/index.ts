// Edge Function trial-lifecycle (T-615a): dipanggil pg_cron tiap jam (`app.request_trial_lifecycle`,
// migrasi 0050) hanya di project ter-hosting. KHUSUS SERVER VENDOR — tidak ikut paket klien.
//
// Apa yang jatuh tempo diputuskan SQL; di sini hanya bagian di luar database: email, Storage, dan
// pembuatan ruang kerja untuk antrean. Semua langkah idempoten, jadi panggilan dari luar (tanpa
// JWT) hanya mengerjakan apa yang memang sudah jatuh tempo.
//   hari 14  email pengingat
//   hari 17  email "Trial berakhir" + vendor; `latest.json` diganti penanda `trialEnded`
//   hari 24  berkas Storage dihapus, lalu venue dan akunnya (`hosting_lifecycle_purge`)
//   kapan pun ada slot: permintaan antre tertua dibuatkan ruang kerja
//   12 bulan: isian form trial yang sudah selesai dilupakan (kebijakan privasi landing, T-616)
import { reply, serviceHeaders, url } from '../_shared/auth.ts';
import { putSnapshotFile, REVALIDATE } from '../_shared/snapshot-files.ts';
import { activate, adminUrl, getRequest, logError, rpc, send } from '../trial-verify/activate.ts';
import { endedMail, reminderMail, vendorMail } from '../trial-verify/mails.ts';

/** Isi `latest.json` venue trial terkunci; dikenali Visitor lewat `trialEnded` (T-615b). */
const TRIAL_ENDED = JSON.stringify({ trialEnded: true });

// Batas antrean per putaran: satu putaran tidak boleh melewati batas waktu Edge Function.
const MAX_ACTIVATIONS = 5;

async function deleteFiles(venueId: string) {
  const files = await rpc<{ bucket_id: string; name: string }[]>('hosting_lifecycle_files', {
    p_venue_id: venueId,
  });
  const byBucket = new Map<string, string[]>();
  for (const { bucket_id, name } of files) {
    byBucket.set(bucket_id, [...(byBucket.get(bucket_id) ?? []), name]);
  }
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 1000) {
      const response = await fetch(`${url}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: serviceHeaders,
        body: JSON.stringify({ prefixes: names.slice(i, i + 1000) }),
      });
      if (!response.ok) throw new Error(`hapus berkas ${bucket}: ${await response.text()}`);
    }
  }
}

Deno.serve(async () => {
  const done = { reminded: 0, locked: 0, deleted: 0, activated: 0, forgotten: 0, failed: 0 };
  const attempt = async (what: string, step: () => Promise<void>) => {
    try {
      await step();
    } catch (error) {
      done.failed += 1;
      logError('trial-lifecycle', `${what}: ${error instanceof Error ? error.message : error}`);
    }
  };

  await attempt('pengingat', async () => {
    const due = await rpc<{ request_id: string; ends_at: string }[]>('hosting_lifecycle_remind');
    for (const trial of due) {
      const request = await getRequest(trial.request_id);
      if (request) await send(reminderMail(request, trial.ends_at, adminUrl));
      done.reminded += 1;
    }
  });

  await attempt('kunci', async () => {
    const locked =
      await rpc<{ request_id: string; venue_id: string; delete_at: string }[]>(
        'hosting_lifecycle_lock',
      );
    for (const trial of locked) {
      const request = await getRequest(trial.request_id);
      if (request) {
        await send(endedMail(request, trial.delete_at));
        await send(vendorMail('ended', request, `Dihapus otomatis ${trial.delete_at}.`));
      }
      done.locked += 1;
    }
  });

  // Penanda ditulis ulang setiap putaran: kegagalan sekali tidak membiarkan peta tetap terbuka.
  await attempt('penanda', async () => {
    const venues = await rpc<{ venue_id: string }[]>('hosting_lifecycle_locked_venues');
    for (const { venue_id } of venues) {
      await putSnapshotFile(`${venue_id}/latest.json`, TRIAL_ENDED, REVALIDATE);
    }
  });

  await attempt('hapus', async () => {
    const expired = await rpc<{ venue_id: string }[]>('hosting_lifecycle_expired');
    for (const { venue_id } of expired) {
      await attempt(`hapus ${venue_id}`, async () => {
        await deleteFiles(venue_id);
        await rpc('hosting_lifecycle_purge', { p_venue_id: venue_id });
        done.deleted += 1;
      });
    }
  });

  await attempt('antrean', async () => {
    for (let i = 0; i < MAX_ACTIVATIONS; i++) {
      const next = await rpc<string | null>('hosting_queue_next');
      if (!next) break;
      const request = await getRequest(next);
      if (!request) continue;
      const result = await activate(request, { notifyQueued: false });
      if (result.outcome !== 'active') break;
      done.activated += 1;
    }
  });

  await attempt('lupakan', async () => {
    done.forgotten = (await rpc<number>('hosting_lifecycle_forget')) ?? 0;
  });

  return reply(done.failed ? 500 : 200, done);
});
