// lint-commits.cjs — higiene de historial.
// Modo normal (CI): avisa sobre los últimos N, nunca falla (exit 0).
// Modo --strict (pre-commit / hook): falla (exit 1) si el HEAD es trivial,
// para bloquear futuros "dfs/nn/x". Uso: node scripts/lint-commits.cjs --strict
const { execFileSync } = require('child_process');
const STRICT = process.argv.includes('--strict');
const N = Number(process.argv[2] || 10);
let log = '';
try { log = execFileSync('git', ['log', `--format=%s`, `-${STRICT ? 1 : N}`], { encoding: 'utf8' }); }
catch { console.log('~ sin git o sin historial, se omite.'); process.exit(0); }
const TRIVIAL = /^(few|as|we|j|df|dfs|fix|up|ok|tmp|test|a+|x+|i|e|efr|nn)\s*$/i;
let bad = 0;
for (const line of log.split('\n').map((s) => s.trim()).filter(Boolean)) {
  if (line.length < 8 || TRIVIAL.test(line)) { console.log(`  ~ trivial: "${line}"`); bad++; }
}
if (STRICT && bad) { console.log('  x HEAD trivial. Usa feat:/fix:/chore:/docs: + descripción (>8 caracteres).'); process.exit(1); }
if (bad) console.log(`Avisos: ${bad} commit(s) triviales. Usa feat:/fix:/chore:/docs: + descripción.`);
else console.log(`OK: últimos ${STRICT ? 1 : N} commits con mensajes descriptivos.`);
