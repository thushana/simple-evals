import React from 'react';
import { Box, Avatar } from '@mui/material';
import { getProviderFavicon } from '../utils/providers';

interface ProviderIconProps {
  provider: string;
  size?: number;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  provider, 
  size = 19 
}) => {
  const [imageError, setImageError] = React.useState(false);
  const faviconUrl = getProviderFavicon(provider);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <Avatar
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.6,
          bgcolor: '#0677C9',
          color: 'white'
        }}
      >
        {provider.charAt(0).toUpperCase()}
      </Avatar>
    );
  }

  return (
    <Box
      component="img"
      src={faviconUrl}
      alt={`${provider} favicon`}
      sx={{
        width: size,
        height: size,
        borderRadius: '2px',
        objectFit: 'contain',
        flexShrink: 0
      }}
      onError={handleImageError}
    />
  );
}; 