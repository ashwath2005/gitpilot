/**
 * GitPilot Release Version Synchronizer & Validator
 * Single authoritative script to update and validate versions across all project artifacts.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function log(msg) {
  console.log(`[VersionSync] ${msg}`);
}

function error(msg) {
  console.error(`[VersionSync ERROR] ${msg}`);
  process.exit(1);
}

// 1. Parse Arguments
const args = process.argv.slice(2);
const validateOnly = args.includes('--validate-only');
const targetVersion = args.find((a) => !a.startsWith('--'));

if (!targetVersion && !validateOnly) {
  error('Missing version argument. Usage: node scripts/release-version.cjs <version>');
}

const packageJsonPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const versionToUse = targetVersion ? targetVersion.replace(/^v/, '') : pkg.version;

if (!semverRegex.test(versionToUse)) {
  error(`Invalid semantic version format: "${versionToUse}". Expected format: MAJOR.MINOR.PATCH (e.g. 1.3.0)`);
}

log(`Target version: v${versionToUse} (Mode: ${validateOnly ? 'Validate' : 'Update & Validate'})`);

// 2. Update package.json
if (!validateOnly && pkg.version !== versionToUse) {
  pkg.version = versionToUse;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  log(`Updated package.json version to ${versionToUse}`);
}

// 3. Update package-lock.json if present
const packageLockPath = path.join(rootDir, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  const pkgLock = JSON.parse(fs.readFileSync(packageLockPath, 'utf8'));
  if (!validateOnly && (pkgLock.version !== versionToUse || (pkgLock.packages && pkgLock.packages[''] && pkgLock.packages[''].version !== versionToUse))) {
    pkgLock.version = versionToUse;
    if (pkgLock.packages && pkgLock.packages['']) {
      pkgLock.packages[''].version = versionToUse;
    }
    fs.writeFileSync(packageLockPath, JSON.stringify(pkgLock, null, 2) + '\n', 'utf8');
    log(`Updated package-lock.json version to ${versionToUse}`);
  }
}

// 4. Update Inno Setup script (installer.iss)
const installerIssPath = path.join(rootDir, 'installer.iss');
if (fs.existsSync(installerIssPath)) {
  let issContent = fs.readFileSync(installerIssPath, 'utf8');
  if (!validateOnly) {
    issContent = issContent.replace(/#define MyAppVersion "[^"]+"/, `#define MyAppVersion "${versionToUse}"`);
    issContent = issContent.replace(/OutputBaseFilename=GitPilot-Setup-v[^\r\n]+/, `OutputBaseFilename=GitPilot-Setup-v${versionToUse}`);
    fs.writeFileSync(installerIssPath, issContent, 'utf8');
    log(`Updated installer.iss version to ${versionToUse}`);
  }
}

// 5. Update Tauri config (src-tauri/tauri.conf.json) if present
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  if (!validateOnly && tauriConf.version !== versionToUse) {
    tauriConf.version = versionToUse;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
    log(`Updated tauri.conf.json version to ${versionToUse}`);
  }
}

// 6. Update CHANGELOG.md if present
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
if (fs.existsSync(changelogPath) && !validateOnly) {
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];
  const versionHeader = `## [${versionToUse}] - ${today}`;
  
  if (!changelog.includes(`## [${versionToUse}]`)) {
    const insertIndex = changelog.indexOf('## [');
    if (insertIndex !== -1) {
      const newSection = `${versionHeader}\n\n### Added\n- Release v${versionToUse}\n\n---\n\n`;
      changelog = changelog.slice(0, insertIndex) + newSection + changelog.slice(insertIndex);
      fs.writeFileSync(changelogPath, changelog, 'utf8');
      log(`Added v${versionToUse} section to CHANGELOG.md`);
    }
  }
}

// 7. Verification Audit
const currentPkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
if (currentPkg.version !== versionToUse) {
  error(`Verification failed: package.json has version ${currentPkg.version}, expected ${versionToUse}`);
}

log(`✅ All version configurations synchronized successfully to v${versionToUse}`);
