#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function findUp(startDir, filenames) {
  let dir = path.resolve(startDir);
  const results = [];
  while (true) {
    for (const name of filenames) {
      const p = path.join(dir, name);
      if (fs.existsSync(p)) results.push(p);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return results;
}

function findPackageDuplicates(root, pkgName) {
  const seen = new Set();
  const results = [];
  function scanNodeModules(nmDir, depth) {
    if (depth > 6) return;
    let entries;
    try { entries = fs.readdirSync(nmDir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(nmDir, e.name);
      if (e.name === pkgName && fs.existsSync(path.join(full, 'package.json'))) {
        const real = fs.realpathSync.native ? fs.realpathSync.native(full) : fs.realpathSync(full);
        if (!seen.has(real)) { seen.add(real); results.push(real); }
      }
      const childNm = path.join(full, 'node_modules');
      if (fs.existsSync(childNm)) scanNodeModules(childNm, depth + 1);
    }
  }
  scanNodeModules(path.join(root, 'node_modules'), 0);
  return results;
}

const projectRoot = process.cwd();
console.log('[diagnose] cwd:', projectRoot);
console.log('[diagnose] node:', process.version);

try {
  console.log('[diagnose] require.resolve("react") ->', require.resolve('react'));
  console.log('[diagnose] require.resolve("react-dom") ->', require.resolve('react-dom'));
  console.log('[diagnose] require.resolve("next") ->', require.resolve('next'));
} catch (e) {
  console.log('[diagnose] resolve error:', e?.message);
}

const lockfiles = findUp(projectRoot, ['package-lock.json','pnpm-lock.yaml','yarn.lock']);
console.log('[diagnose] lockfiles found up the tree:', lockfiles);

const reactInstalls = findPackageDuplicates(projectRoot, 'react');
const reactDomInstalls = findPackageDuplicates(projectRoot, 'react-dom');
console.log('[diagnose] react installs:', reactInstalls);
console.log('[diagnose] react-dom installs:', reactDomInstalls);

if (reactInstalls.length > 1 || reactDomInstalls.length > 1) {
  console.log('[diagnose] WARNING: multiple React installs can break builds.');
}
