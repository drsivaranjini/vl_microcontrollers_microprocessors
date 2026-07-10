interface LogosProps {
  srmLogo: string | null;
  bmeLogo: string | null;
  size?: number;
  onDark?: boolean;
}

// Purely presentational — resolving whether the real logo files exist yet happens server-side
// (src/lib/assets.ts, read once in layout.tsx) since that check needs node:fs, which client
// components (Nav.tsx) can't import. Falls back to text badges until the files exist —
// docs/14_QA_ROUND3_AND_DLMS_MATCH.md PART C. No code change needed once the user drops them in.
export default function Logos({ srmLogo, bmeLogo, size = 36, onDark = false }: LogosProps) {
  const badgeClass = onDark
    ? 'flex items-center justify-center rounded-lab bg-white/10 text-xs font-bold text-white'
    : 'flex items-center justify-center rounded-lab bg-brand-700 text-xs font-bold text-white';

  return (
    <div className="flex items-center gap-2">
      {srmLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={srmLogo} alt="SRM Institute of Science and Technology" style={{ height: size }} />
      ) : (
        <span className={badgeClass} style={{ height: size, width: size }}>
          SRM
        </span>
      )}
      {bmeLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bmeLogo} alt="Department of Biomedical Engineering" style={{ height: size }} />
      ) : (
        <span className={badgeClass} style={{ height: size, width: size }}>
          BME
        </span>
      )}
    </div>
  );
}
