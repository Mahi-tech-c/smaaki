import React, { createContext, useContext } from 'react';

// Theme is permanently locked to 'dark' — professional dark look only.
// No user-facing toggle; no system preference detection.

export const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Always ensure the dark class is applied on mount via a simple side-effect
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
    root.classList.remove('light');
  }, []);

  const value = {
    theme: 'dark',
    isDark: true,
    toggleTheme: () => {}, // no-op
    setTheme: () => {},    // no-op
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
