import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Server-only: checks whether the user has dropped a real asset file into public/ yet, so logo/
// photo <img> tags become an automatic drop-in the moment the file appears — no code change
// needed (docs/14_QA_ROUND3_AND_DLMS_MATCH.md PART C). Only import this from Server Components.
function publicAssetExists(relPath: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', relPath));
  } catch {
    return false;
  }
}

export const assets = {
  srmLogo: publicAssetExists('logos/srm-logo.png') ? '/logos/srm-logo.png' : null,
  bmeLogo: publicAssetExists('logos/bme-dept-logo.png') ? '/logos/bme-dept-logo.png' : null,
  facultyPhoto: publicAssetExists('faculty/dr-sivaranjini.jpg') ? '/faculty/dr-sivaranjini.jpg' : null,
};
