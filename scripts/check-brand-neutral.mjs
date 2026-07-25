// The contract that lets two separate products share this package:
//
//   The package ships BEHAVIOUR and token NAMES.
//   Each consumer supplies the token VALUES.
//
// A dropdown knows how to trap focus, do type-ahead and mirror a hidden
// <select>. It must not know what green is. The moment a brand value lands
// here, the consumers are coupled and "separate products" stops being true.
//
// This check is mechanical so the rule survives contributors who have not
// read the README.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = ['src/admin-kit.css', 'src/admin-kit.js', 'src/admin-kit.html'];
const problems = [];

// Allowed: `inherit`, and one neutral monospace stack for code/number fields
// (a monospace fallback list carries no brand).
const FONT_OK = /font-family:\s*(inherit|ui-monospace)/;

for (const rel of files) {
  const body = readFileSync(join(root, rel), 'utf8');
  body.split('\n').forEach((line, i) => {
    const at = `${rel}:${i + 1}`;

    const hex = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    // #fff etc. inside a url()/id selector is not a colour; require a colour-ish context
    if (hex && /(color|background|border|shadow|fill|stroke|outline)/i.test(line)) {
      problems.push(`${at}  hex literal ${hex.join(', ')} — use a var(--token)`);
    }
    if (/\b(rgb|rgba|hsl|hsla)\(\s*\d/.test(line) && !/var\(--/.test(line)) {
      problems.push(`${at}  literal colour function — use a var(--token)`);
    }
    if (/font-family:/.test(line) && !FONT_OK.test(line)) {
      problems.push(`${at}  font-family must be 'inherit' or the monospace stack`);
    }
  });
}

if (problems.length) {
  console.error('Brand-neutrality check FAILED:\n' + problems.map(p => '  ' + p).join('\n'));
  console.error('\nThe package must not carry brand values. See README "The contract".');
  process.exit(1);
}
console.log(`brand-neutral: OK (${files.length} files, no colour or font literals)`);
