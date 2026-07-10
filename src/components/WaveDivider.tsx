// Diagonal wave transition from the navy hero into the next (light) section — doc 14 PART B.2.
export default function WaveDivider() {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="block h-10 w-full text-bg sm:h-16"
      aria-hidden="true"
    >
      <path d="M0 0L1440 40L1440 80L0 80Z" fill="currentColor" />
    </svg>
  );
}
