const { execFile } = require('node:child_process');
const { existsSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);

function findWindowsSdkSignTool() {
  const programFilesX86 = process.env['ProgramFiles(x86)'];
  if (!programFilesX86) {
    throw new Error('Cannot locate Program Files (x86) to find the Windows SDK SignTool.');
  }

  const binDirectory = join(programFilesX86, 'Windows Kits', '10', 'bin');
  if (!existsSync(binDirectory)) {
    throw new Error('Windows 10/11 SDK SignTool is required. Install the Windows SDK Signing Tools component, then retry.');
  }

  const versions = readdirSync(binDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const version of versions) {
    const signTool = join(binDirectory, version, 'x64', 'signtool.exe');
    if (existsSync(signTool)) {
      return signTool;
    }
  }

  throw new Error('Windows SDK SignTool for x64 was not found. Install the Windows SDK Signing Tools component, then retry.');
}

module.exports = async function signInternalWindowsArtifact(configuration) {
  const certificatePath = process.env.CSC_LINK;
  const certificatePassword = process.env.CSC_KEY_PASSWORD;

  if (!certificatePath || !certificatePassword) {
    throw new Error('CSC_LINK and CSC_KEY_PASSWORD must be set by build-internal-app.ps1.');
  }

  const args = ['sign', '/fd', configuration.hash.toUpperCase(), '/f', certificatePath, '/p', certificatePassword];
  if (configuration.isNest) {
    args.push('/as');
  }
  args.push(configuration.path);

  try {
    await execFileAsync(findWindowsSdkSignTool(), args, { windowsHide: true });
  }
  catch (error) {
    const detail = error.stderr || error.stdout || error.message;
    throw new Error(`Windows SDK SignTool failed for '${configuration.path}': ${detail}`);
  }
};
