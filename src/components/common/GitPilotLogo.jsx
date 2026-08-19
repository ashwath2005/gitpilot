import React from 'react';

/**
 * GitPilot Vector Brand Logo
 */
export function GitPilotLogo({ size = 24, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="gp-gradient" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#818CF8" />
        </linearGradient>
        <filter id="gp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Rounded Container Box */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#0A0A0A" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1.2" />

      {/* Outer subtle precision ring */}
      <circle cx="16" cy="16" r="11" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" strokeDasharray="2 2" />

      {/* Main Git Branch Trunk */}
      <path d="M11 23V9" stroke="url(#gp-gradient)" strokeWidth="2.2" strokeLinecap="round" />

      {/* Branch Fork Curve */}
      <path d="M11 17C14.5 17 17.5 14 17.5 10.5" stroke="#818CF8" strokeWidth="2.2" strokeLinecap="round" />

      {/* Forward Pilot Arrow / Vector Head */}
      <path d="M17.5 7.5L23.5 10.5L17.5 13.5V7.5Z" fill="#6366F1" filter="url(#gp-glow)" />

      {/* Git Nodes */}
      <circle cx="11" cy="22" r="2" fill="#0E0E0F" stroke="#6366F1" strokeWidth="1.8" />
      <circle cx="11" cy="9" r="2" fill="#0E0E0F" stroke="#818CF8" strokeWidth="1.8" />

      {/* Live Status Accent Dot */}
      <circle cx="21" cy="21" r="1.5" fill="#22C55E" />
    </svg>
  );
}
