import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'

const theme = createTheme({
  palette: {
    primary: {
      main: '#009cde', // College Board primary blue (cb-blue2)
      light: '#0077c8',
      dark: '#324dc7', // College Board blue5
    },
    secondary: {
      main: '#fedb00', // College Board yellow
    },
    text: {
      primary: '#1e1e1e', // College Board black1
      secondary: '#4D4D4D', // College Board gray
    },
    background: {
      default: '#fff',
      paper: '#fff',
    },
    divider: '#d9d9d9', // College Board gray
    grey: {
      50: '#f0f0f0', // College Board gray5-bg
      100: '#d9d9d9', // College Board gray
      500: '#4D4D4D', // College Board gray
      900: '#1e1e1e', // College Board black1
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#1e1e1e',
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      color: '#1e1e1e',
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 500,
      color: '#1e1e1e',
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 500,
      color: '#1e1e1e',
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      color: '#1e1e1e',
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      color: '#1e1e1e',
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.5,
      color: '#1e1e1e',
    },
    body2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#4D4D4D',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px', // College Board fully rounded buttons
          padding: '11px 23px',
          fontWeight: 700,
          fontSize: '0.875rem',
          lineHeight: '24px',
          textTransform: 'none',
          transition: 'all 0.25s ease-in-out',
          minHeight: '44px',
        },
        contained: {
          backgroundColor: '#009cde',
          color: '#fff',
          '&:hover': {
            backgroundColor: '#0077c8',
            boxShadow: 'inset 0 0 0 1px #1e1e1e',
          },
          '&:focus': {
            boxShadow: 'inset 0 0 0 2px #1e1e1e',
            textDecoration: 'underline',
          },
        },
        outlined: {
          borderColor: '#1e1e1e',
          color: '#1e1e1e',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            boxShadow: 'inset 0 0 0 1px #1e1e1e',
          },
        },
        text: {
          color: '#009cde',
          '&:hover': {
            backgroundColor: '#f0f0f0',
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          border: '1px solid #d9d9d9',
          borderRadius: '8px',
        },
        standardSuccess: {
          backgroundColor: '#f0f9ff',
          color: '#009cde',
          borderColor: '#009cde',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderColor: '#fca5a5',
        },
        standardInfo: {
          backgroundColor: '#f0f9ff',
          color: '#009cde',
          borderColor: '#009cde',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
        },
        outlined: {
          borderColor: '#009cde',
          color: '#009cde',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: '1200px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#d9d9d9',
        },
      },
    },
  },
  spacing: 8, // Base spacing unit
  shape: {
    borderRadius: 8,
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
