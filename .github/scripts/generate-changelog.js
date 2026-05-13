const fs = require('fs');
const path = require('path');

const logPath = path.join(process.cwd(), 'raw_log.txt');
const outputPath = path.join(process.cwd(), 'changelog.md');

try {
  const data = fs.readFileSync(logPath, 'utf8');
  const lines = data.split('\n').filter(line => line.trim() !== '');

  let changelog = '## 📝 O que mudou\n\n';

  if (lines.length === 0) {
    changelog += '* Nenhuma alteração significativa encontrada.\n';
  } else {
    lines.forEach(line => {
      // Remove prefixes common in commits like "feat:", "fix:", etc for cleaner look if desired
      // or just use them as is.
      changelog += `${line}\n`;
    });
  }

  fs.writeFileSync(outputPath, changelog);
  console.log('Changelog gerado com sucesso!');
} catch (err) {
  console.error('Erro ao gerar changelog:', err);
  process.exit(1);
}
