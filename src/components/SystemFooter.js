import React from 'react';
import { Box, Typography, Fade, Skeleton } from '@mui/material';
import { Book } from '@mui/icons-material';
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
    <Fade in timeout={800}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: currentSize.py,
          px: 3,
          mt: 4,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(15, 15, 25, 0.3)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px 12px 0 0',
          ...sx
        }}
      >
        {/* Logo y nombre del sistema */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: currentSize.gap,
            mb: 1
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <img 
              src="/logo.webp" 
              alt="WPTAssig Logo" 
              style={{
                width: currentSize.logo.width,
                height: currentSize.logo.height,
                objectFit: 'cover',
                borderRadius: '4px'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <Book 
              sx={{ 
                color: 'primary.main', 
                fontSize: currentSize.logo.fontSize, 
                display: 'none' 
              }} 
            />
          </Box>
          
          {loading ? (
            <Skeleton width={100} height={currentSize.name.fontSize} />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: currentSize.name.fontSize,
                letterSpacing: '0.05em'
              }}
            >
              {systemName}
            </Typography>
          )}
          
          {loading ? (
            <Skeleton width={60} height={currentSize.version.fontSize} />
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                fontSize: currentSize.version.fontSize,
                px: 1.5,
                py: 0.5,
                bgcolor: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                lineHeight: 1
              }}
            >
              ver. {systemVersion}
            </Typography>
          )}
        </Box>

        {/* Copyright */}
        {showCopyright && (
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: currentSize.copyright.fontSize,
              textAlign: 'center',
              opacity: 0.8,
              fontWeight: 400
            }}
          >
            © {new Date().getFullYear()} WhitePearl Translations. Todos los derechos reservados
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default SystemFooter;