interface FikrinceLogoProps {
  tone?: 'dark' | 'light';
  size?: 'sm' | 'lg';
}

export function FikrinceLogo({ tone = 'dark', size = 'sm' }: FikrinceLogoProps) {
  const isLg = size === 'lg';
  const textColor = tone === 'light' ? 'text-[#F5F4EE]' : 'text-[#111210]';
  const markBg = tone === 'light' ? '#D4FF00' : '#111210';
  const markStroke = tone === 'light' ? '#111210' : '#D4FF00';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        width={isLg ? 42 : 28}
        height={isLg ? 42 : 28}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="36" height="36" rx="9" fill={markBg} />
        <path
          d="M11 10.5H25V15.2H16.2V17.8H22.8V22.2H16.2V26.5H11V10.5Z"
          fill={markStroke}
        />
        <rect x="22" y="21.5" width="4.5" height="4.5" rx="1.2" fill={markStroke} />
      </svg>
      <span
        className={`font-display font-extrabold tracking-tight ${textColor} ${
          isLg ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl'
        }`}
      >
        FİKRİNCE
      </span>
    </span>
  );
}
