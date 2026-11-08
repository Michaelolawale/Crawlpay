// Automatically patches Next.js 14 Windows path normalization bug in verifyTypeScriptSetup
const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'lib', 'has-necessary-dependencies.js');

if (fs.existsSync(targetFile)) {
  try {
    let content = fs.readFileSync(targetFile, 'utf8');
    const buggyCode = 'const fileNameToVerify = (0, _path.relative)(p.pkg, p.file);';
    const fixedCode = `const normalizedPkg = p.pkg.replace(/\\//g, _path.sep);
                const normalizedFile = p.file.replace(/\\//g, _path.sep);
                const fileNameToVerify = (0, _path.relative)(normalizedPkg, normalizedFile);`;

    if (content.includes(buggyCode)) {
      content = content.replace(buggyCode, fixedCode);
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log('[patch-next] Successfully patched Next.js Windows TypeScript path resolution.');
    }
  } catch (err) {
    console.warn('[patch-next] Could not patch Next.js:', err.message);
  }
}

