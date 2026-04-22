import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SRC_ROOT = join(__dirname, '..');

const DISALLOWED = /[\u00ab\u00bb\u201c\u201d\u2018\u2019\u200b\u200e\u200f]/;

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name === '__tests__') continue;
    const p = join(dir, name);
    const st = statSync(p, { throwIfNoEntry: false });
    if (!st) continue;
    if (st.isDirectory()) walkTsFiles(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

describe('Texto UI en src sin caracteres tipográficos problemáticos', () => {
  it('no hay guillemets, comillas tipográficas, ZWSP ni marcas direccionales en .ts/.tsx', () => {
    const files = walkTsFiles(SRC_ROOT);
    const hits: { file: string; line: number; text: string }[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const lines = text.split(/\r?\n/);
      lines.forEach((line, i) => {
        if (DISALLOWED.test(line)) {
          hits.push({ file: relative(SRC_ROOT, file), line: i + 1, text: line.trim().slice(0, 120) });
        }
      });
    }
    expect(hits, JSON.stringify(hits, null, 2)).toEqual([]);
  });
});
