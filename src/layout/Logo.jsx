import React from 'react';
import { Box, Typography } from '@mui/material';

export function Logo({ compact = false, light = false, size = 1 }) {
  const color = light ? '#e8f3ee' : '#0b2e24';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        component="svg"
        viewBox="0 0 64 64"
        sx={{ width: 36 * size, height: 36 * size, flexShrink: 0 }}
        aria-label="JD EVENTS Design Studio"
      >
        <rect width="64" height="64" rx="14" fill={light ? 'rgba(255,255,255,0.08)' : '#0b2e24'} />
        <path d="M14 46V18h4l18 20V18h4v28h-4L18 26v20z" fill={light ? '#e8f3ee' : '#e8f3ee'} />
        <path d="M44 46l6-12 6 12" stroke="#c9a24a" strokeWidth="3" fill="none" strokeLinejoin="round" />
      </Box>
      {!compact && (
        <Box sx={{ lineHeight: 1 }}>
          <Typography sx={{ fontFamily: '"Space Grotesk"', fontWeight: 700, letterSpacing: '0.18em', fontSize: 17 * size, color }}>JD EVENTS</Typography>
          <Typography sx={{ fontSize: 10 * size, letterSpacing: '0.28em', color, opacity: 0.7, mt: 0.25 }}>EVENT AND EXHIBITION</Typography>
        </Box>
      )}
    </Box>
  );
}
