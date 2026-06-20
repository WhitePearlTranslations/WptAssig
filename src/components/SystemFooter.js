import React from 'react';
import { Box, Typography, Fade } from '@mui/material';
import { useSystemConfig } from '../hooks/useSystemConfig';

const SystemFooter = ({ sx = {}, showCopyright = true, size = 'medium' }) => {
  const { systemName, systemVersion, loading } = useSystemConfig();

  const sizeStyles = {
    small: {
      logo: { width: 20, height: 20, fontSize: '1rem' },
      name: { fontSize: '0.875rem' },
      version: { fontSize: '0.75rem' },
      copyright: { fontSize: '0.7rem' },
      gap: 1,
      py: 1
    },
    medium: {
      logo: { width: 24, height: 24, fontSize: '1.2rem' },
      name: { fontSize: '1rem' },
      version: { fontSize: '0.875rem' },
      copyright: { fontSize: '0.75rem' },
      gap: 1.5,
      py: 2
    },
    large: {
      logo: { width: 32, height: 32, fontSize: '1.5rem' },
      name: { fontSize: '1.25rem' },
      version: { fontSize: '1rem' },
      copyright: { fontSize: '0.875rem' },
      gap: 2,
      py: 3
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: currentSize.py,
          px: 2,
          mt: 3,
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          ...sx
        }}
      >
        {showCopyright && (
          <Typography
            variant="caption"
            sx={{
              color: '#7d8190',
              fontSize: currentSize.copyright.fontSize,
              textAlign: 'center',
              fontWeight: 400,
            }}
          >
            © {new Date().getFullYear()} {loading ? 'White Pearl Translation' : systemName}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default SystemFooter;