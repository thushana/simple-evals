import React from 'react';
import { TableCell } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface HeaderCellProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  width?: number | string;
  [key: string]: any; // allow extra props
}

export const HeaderCell: React.FC<HeaderCellProps> = ({ children, sx, align, width, ...rest }) => (
  <TableCell
    align={align}
    sx={{
      fontWeight: 700,
      backgroundColor: '#009cde',
      color: 'white',
      borderColor: '#009cde',
      fontSize: '0.95rem',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      lineHeight: 1.2,
      ...((width && { width }) || {}),
      ...sx
    }}
    {...rest}
  >
    {children}
  </TableCell>
); 