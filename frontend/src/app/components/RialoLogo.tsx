// Rialo Logo Component - Enhanced geometric mark
export function RialoLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cloud-inspired flowing shapes */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        
        {/* Main cloud shape */}
        <path
          d="M7 14 C7 10 10 8 13 8 C14 6 16 5 18 5 C21 5 23 7 24 9 C26 9 28 11 28 14 C28 17 26 19 23 19 L10 19 C8 19 7 17 7 14Z"
          fill="url(#logoGradient)"
        />
        {/* Rain drops */}
        <circle cx="12" cy="22" r="1.5" fill="currentColor" opacity="0.8" />
        <circle cx="16" cy="24" r="1.5" fill="currentColor" opacity="0.6" />
        <circle cx="20" cy="22" r="1.5" fill="currentColor" opacity="0.8" />
      </svg>
    </div>
  );
}

// Full logo with wordmark
export function RialoWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <RialoLogo size={32} />
      <span className="text-[20px] font-bold text-[#1a1714]">Rialo</span>
    </div>
  );
}
