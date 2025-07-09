import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import type { ResultEntry, SortField, SortConfig } from '../types/dashboard.types';
import { SortableHeader } from './SortableHeader';
import { ProviderIcon } from './ProviderIcon';
import { AccuracyIndicator } from './AccuracyIndicator';
import { BestPerformerBadge } from './BestPerformerBadge';
import { DownloadButton } from './DownloadButton';
import { formatTime, formatDate, formatScore } from '../utils/formatters';
import { getProviderDisplayName } from '../utils/providers';
import { HeaderCell } from './HeaderCell';

interface ResultsTableProps {
  data: ResultEntry[];
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onViewJson: (filename: string, title: string) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  sortConfig,
  onSort,
  onViewJson
}) => {
  const handleViewJson = (entry: ResultEntry) => {
    const title = `${entry.exam} - ${entry.model} (${entry.provider})`;
    onViewJson(entry.results, title);
  };

  return (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', maxWidth: 1500, margin: '0 auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <SortableHeader field="star" label={<StarIcon sx={{ color: 'white', fontSize: '1.2rem' }} />} sortConfig={sortConfig} onSort={onSort} align="center" />
            {/* Column headers: heavy bold, white */}
            {/* We'll add the star column in the next step */}
            <SortableHeader field="exam" label="Exam" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="model" label="Model" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="provider" label="Provider" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="accuracy" label="Accuracy" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="score" label="Score" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="time" label="Time" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader field="date" label="Date" sortConfig={sortConfig} onSort={onSort} />
            <HeaderCell>Actions</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((entry) => (
            <TableRow
              key={`${entry.exam}-${entry.model}-${entry.provider}-${entry.date}`}
            >
              <TableCell sx={{ textAlign: 'center', width: 40 }}>
                <BestPerformerBadge isBest={entry.is_best} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E1E1E' }}>
                  {entry.exam}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Roboto Mono, monospace',
                    fontWeight: 500,
                    minWidth: 120,
                    display: 'inline-block'
                  }}
                >
                  {entry.model}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ProviderIcon provider={entry.provider} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getProviderDisplayName(entry.provider)}
                  </Typography>
                </Box>
              </TableCell>
              
              <TableCell align="right">
                <AccuracyIndicator accuracy={entry.accuracy} />
              </TableCell>
              
              <TableCell align="right">
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Roboto Mono, monospace',
                    textAlign: 'right',
                    fontWeight: 500
                  }}
                >
                  {formatScore(entry.score, entry.total_possible)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Roboto Mono, monospace',
                    textAlign: 'right',
                    fontWeight: 500
                  }}
                >
                  {formatTime(entry.time)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'Roboto Mono, monospace',
                    fontSize: '0.9em',
                    color: '#5a9bd4'
                  }}
                >
                  {formatDate(entry.date)}
                </Typography>
              </TableCell>
              
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title={`View ${entry.exam} - ${entry.model} results`}>
                    <IconButton
                      onClick={() => handleViewJson(entry)}
                      size="small"
                      sx={{
                        color: '#0677C9',
                        '&:hover': {
                          backgroundColor: 'rgba(6, 119, 201, 0.1)'
                        }
                      }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <DownloadButton
                    filename={entry.results}
                    exam={entry.exam}
                    model={entry.model}
                  />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 