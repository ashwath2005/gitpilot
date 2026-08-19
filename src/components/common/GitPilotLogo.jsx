import React from 'react';
import gitpilotLogoImg from '../../assets/gitpilot_logo.png';

/**
 * GitPilot Official Brand Logo
 */
export function GitPilotLogo({ size = 26, className = '', style = {} }) {
  return (
    <img
      src={gitpilotLogoImg}
      alt="GitPilot"
      width={size}
      height={size}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        borderRadius: '6px',
        flexShrink: 0,
        display: 'inline-block',
        ...style,
      }}
    />
  );
}
