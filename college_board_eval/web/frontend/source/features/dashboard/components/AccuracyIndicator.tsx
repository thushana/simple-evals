import React from 'react';
import { Typography } from '@mui/material';
import { formatAccuracy, getAccuracyColor } from '../utils/formatters';

interface AccuracyIndicatorProps {
  accuracy: number;
  variant?: 'body1' | 'body2';
}

export const AccuracyIndicator: React.FC<AccuracyIndicatorProps> = ({ 
  accuracy, 
  variant = 'body1' 
}) => {
  const color = getAccuracyColor(accuracy);
  const formattedAccuracy = formatAccuracy(accuracy);

  return (
    <Typography
      variant={variant}
      sx={{
        color,
        fontWeight: 'bold',
        fontFamily: 'Roboto Mono, monospace'
      }}
    >
      {formattedAccuracy}
    </Typography>
  );
}; 