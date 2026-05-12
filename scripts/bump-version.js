const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const appJsonPath = path.join(__dirname, '../app.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const currentVersion = packageJson.version;
const versionParts = currentVersion.split('.').map(Number);
versionParts[2] += 1; // Increment patch
const newVersion = versionParts.join('.');

console.log(`Bumping version from ${currentVersion} to ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update app.json
appJson.expo.version = newVersion;

// Update android versionCode if it exists, otherwise start at 1
if (appJson.expo.android) {
  if (!appJson.expo.android.versionCode) {
    appJson.expo.android.versionCode = 1;
  } else {
    appJson.expo.android.versionCode += 1;
  }
} else {
  appJson.expo.android = { versionCode: 1 };
}

fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log('Version bump complete.');
