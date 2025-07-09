import React from 'react';
import { TableCell, Box, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import type { SortField, SortConfig } from '../types/dashboard.types';

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  sortConfig,
  onSort
}) => {
  const isActive = sortConfig.field === field;
  const isAscending = sortConfig.direction === 'asc';

  const handleClick = () => {
    onSort(field);
  };

  const getSortIcon = () => {
    if (!isActive) {
      return <UnfoldMoreIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />;
    }
    
    return isAscending ? (
      <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: '1rem' }} />
    );
  };

  return (
    <TableCell
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: '#e3f2fd'
        },
        fontWeight: 800,
        backgroundColor: '#0677C9',
        borderColor: '#0677C9',
        color: 'white',
        fontSize: '1rem',
        letterSpacing: 0.5,
        textTransform: 'none',
        lineHeight: 1.2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'inherit' }}>
          {label}
        </Typography>
        {getSortIcon()}
      </Box>
    </TableCell>
  );
}; 