import { DataError } from './errors';

/**
 * RLS tidak melempar error untuk update/delete yang dilarang; hasilnya 0 baris.
 * Jika baris masih terlihat oleh pengguna, berarti ia tidak berhak mengubahnya;
 * jika tidak terlihat, barisnya tidak ada (atau tidak boleh dibaca).
 */
export async function zeroRowsError(isVisible: () => Promise<boolean>): Promise<DataError> {
  return (await isVisible()) ? new DataError('forbidden') : new DataError('not_found');
}
