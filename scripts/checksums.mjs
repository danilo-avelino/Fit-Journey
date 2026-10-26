import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = (await readdir('release')).filter(name => /\.(exe|zip)$/.test(name)).sort();
if (!files.length) throw new Error('Nenhum pacote encontrado em release/.');
const sums = await Promise.all(files.map(async name => `${createHash('sha256').update(await readFile(`release/${name}`)).digest('hex')}  ${name}`));
await writeFile('release/SHA256SUMS.txt', sums.join('\n') + '\n');
console.log(`Checksums gerados para ${files.length} pacotes.`);
