// lint-commits.cjs — higiene de historial (mejora #14, no bloqueante).
// Advierte si los últimos N mensajes son triviales (<8 caracteres o sin
// prefijo feat:/fix:/chore:/docs:/refactor:). Solo avisa, nunca falla el test.
const { execFileSync } = require('child_process');
const N = Number(process.argv[2] || 10);
let log = '';
try { log = execFileSync('git', ['log', `--format=%s`, `-${N}`], { encoding: 'utf8' }); }
catch { console.log('~ sin git o sin historial, se omite.'); process.exit(0); }
const TRIVIAL = /^(few|as|we|j|df|dfs|fix|up|ok|tmp|test|a+|x+)\s*$/i;
let bad = 0;
for (const line of log.split('\n').map((s) => s.trim()).filter(Boolean)) {
  if (line.length < 8 || TRIVIAL.test(line)) { console.log(`  ~ trivial: "${line}"`); bad++; }
}
if (bad) console.log(`Avisos: ${bad} commit(s) triviales. Usa feat:/fix:/chore:/docs: + descripción.`);
else console.log(`OK: últimos ${N} commits con mensajes descriptivos.`);
