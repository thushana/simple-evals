import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ minHeight: '100vh', background: '#fff' }}>
    {/* College Board Black Top Line */}
    <Box sx={{ width: '100%', height: '5px', background: '#111', position: 'relative', top: 0, left: 0, zIndex: 1200 }} />
    {/* Nav bar */}
    <Box sx={{ background: '#fff', minHeight: 64, px: 0 }}>
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', minHeight: 64, px: 0 }}>
        <Box sx={{ pl: '30px', height: 64, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 4 }}>
          <img src="/images/college_board_logo.svg" alt="College Board" style={{ height: 36, width: 'auto', display: 'block' }} />
        </Box>
        <Tabs
          value={0} // TODO: Accept activeTab as prop if needed
          sx={{
            minHeight: 64,
            height: 64,
            ml: 'auto',
            '& .MuiTab-root': {
              color: '#222',
              fontWeight: 500,
              fontSize: '1.1rem',
              textTransform: 'none',
              minWidth: 120,
              px: 2,
              py: 1.5,
              position: 'relative',
              zIndex: 1,
              background: 'none',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              '&.Mui-selected, &:hover': {
                color: '#111',
              },
              '&:hover:after, &.Mui-selected:after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '4px',
                background: '#111',
                borderRadius: 2,
                zIndex: 2,
              },
              '&:not(:hover):not(.Mui-selected):after': {
                content: 'none',
              },
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab label="Project" />
          <Tab label="Dashboard" />
          <Tab label="Exam Extractor" />
        </Tabs>
      </Container>
    </Box>
    {/* Main content */}
    {children}
    {/* Footer - College Board Style */}
    <Box sx={{ 
      backgroundColor: '#1e1e1e',
      color: '#fff',
      py: 4,
      mt: 8,
      position: 'relative',
    }}>
      {/* Yellow line on top of footer */}
      <Box sx={{ width: '100%', height: '5px', background: '#fedb00', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            textAlign: 'center',
            color: '#d9d9d9',
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            fontSize: '0.875rem',
          }}
        >
          © 2025 College Board | PSAT/NMSQT is a registered trademark of the College Board and National Merit Scholarship Corporation.
        </Typography>
      </Container>
    </Box>
  </Box>
);

import { Box, Container, Tabs, Tab, Typography } from '@mui/material';
export default Layout; 