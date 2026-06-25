/**
 * Combined build script — builds all 3 panels and merges into combined_dist/
 *
 * Output structure:
 *   combined_dist/           ← Customer Panel  (/)
 *   combined_dist/admin/     ← Admin Panel     (/admin)
 *   combined_dist/agent/     ← Agent Panel     (/agent)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = __dirname

function run(cmd, cwd, env = {}) {
  console.log(`\n>>> ${cmd}`)
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  })
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  execSync(`cp -r "${src}/." "${dest}/"`)
}

const panels = [
  { dir: 'customer_panel', dest: '',      basePath: '/'       },
  { dir: 'admin_panel',    dest: 'admin', basePath: '/admin/' },
  { dir: 'agent_panel',    dest: 'agent', basePath: '/agent/' },
]

// Build each panel
for (const p of panels) {
  const panelPath = path.join(root, p.dir)
  console.log(`\n${'='.repeat(50)}`)
  console.log(`Building: ${p.dir}  (base: ${p.basePath})`)
  console.log('='.repeat(50))
  run('npm install', panelPath)
  run('npm run build', panelPath, { VITE_BASE_PATH: p.basePath })
}

// Combine into combined_dist/
const combined = path.join(root, 'combined_dist')
if (fs.existsSync(combined)) execSync(`rm -rf "${combined}"`)
fs.mkdirSync(combined)

for (const p of panels) {
  const src  = path.join(root, p.dir, 'dist')
  const dest = p.dest ? path.join(combined, p.dest) : combined
  console.log(`\nCopying ${p.dir}/dist → combined_dist/${p.dest || '(root)'}`)
  copyDir(src, dest)
}

console.log('\n✅ All 3 panels built and combined into combined_dist/')
