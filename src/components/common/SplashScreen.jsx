import React, { useState, useEffect } from 'react';
import { ShieldCheck, GitBranch, Terminal, Sparkles } from 'lucide-react';
import { APP_VERSION } from '../../config/version';
import { GitPilotLogo } from './GitPilotLogo';

export function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing Git core engine...');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText('Scanning local workspace...');
    }, 350);

    const t2 = setTimeout(() => {
      setProgress(80);
      setStatusText('Enabling secret blocker & AI commit model...');
    }, 750);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Workspace Ready');
    }, 1150);

    const t4 = setTimeout(() => {
      setIsFading(true);
    }, 1450);

    const t5 = setTimeout(() => {
      onFinish();
    }, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.35s ease-out',
        pointerEvents: isFading ? 'none' : 'all',
        userSelect: 'none',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(5, 5, 5, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '380px',
          width: '90%',
        }}
      >
        {/* Animated App Logo with Glow */}
        <div
          style={{
            position: 'relative',
            width: '88px',
            height: '88px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(129, 140, 248, 0.1))',
              filter: 'blur(12px)',
              animation: 'pulseGlow 2s infinite alternate',
            }}
          />
          <GitPilotLogo size={72} />
        </div>

        {/* Brand Name & Version */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#F5F5F5',
              margin: 0,
              fontFamily: 'var(--font-sans)',
            }}
          >
            GitPilot
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(99, 102, 241, 0.18)',
              color: '#818CF8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '2px 7px',
              borderRadius: '6px',
            }}
          >
            v{APP_VERSION}
          </span>
        </div>

        <p
          style={{
            fontSize: '13px',
            color: '#A1A1AA',
            margin: '0 0 28px 0',
            fontWeight: 400,
          }}
        >
          Your Autonomous Git Workspace
        </p>

        {/* Sleek Progress Bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '14px',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366F1, #818CF8, #22C55E)',
              borderRadius: '999px',
              transition: 'width 0.4s ease-in-out',
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
            }}
          />
        </div>

        {/* Live Loading Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#71717A',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22C55E',
              boxShadow: '0 0 6px #22C55E',
            }}
          />
          {statusText}
        </div>
      </div>
    </div>
  );
}
