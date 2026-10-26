// Pemberitahuan pihak ketiga untuk paket yang dipasang apa adanya (bukan di-bundle), misalnya
// paket domain di image Edge Function: node src/cli.ts "<judul>" <folder node_modules>
import { noticesOf, packageRootsIn, renderNotices } from './index.ts';

const [product, nodeModules] = process.argv.slice(2);
if (!product || !nodeModules) {
  process.stderr.write('Pemakaian: node src/cli.ts "<judul>" <folder node_modules>\n');
  process.exit(2);
}
process.stdout.write(renderNotices(product, noticesOf(packageRootsIn(nodeModules))));
