import { createContext, useContext, useState } from 'react'

export const THEMES = {
  dark: {
    id: 'dark',
    label: 'Dark',
    swatch: '#0a0a0f',
    bg: '#0a0a0f',
    surface: '#13131a',
    deep: '#0d0d14',
    border: '#1f1f2e',
    borderSubtle: '#2a2a3e',
    text: '#f0f0f5',
    textMuted: '#6b6b8a',
    textDim: '#9090b0',
    rowAlt: '#0f0f18',
    navBg: 'rgba(10,10,15,0.88)',
    inputBg: '#0d0d14',
    shimmer1: '#1a1a26',
    shimmer2: '#22223a',
    errorBg: '#1a0a0a',
    errorBorder: '#3a1010',
    spinnerShadow: 'inset 0 0 40px rgba(0,0,0,0.6)',
  },
  darkBlue: {
    id: 'darkBlue',
    label: 'Navy',
    swatch: '#06101e',
    bg: '#06101e',
    surface: '#0b1a2e',
    deep: '#060e1a',
    border: '#0f2a44',
    borderSubtle: '#143658',
    text: '#ddeaf8',
    textMuted: '#4e7499',
    textDim: '#6a90b0',
    rowAlt: '#071320',
    navBg: 'rgba(6,16,30,0.9)',
    inputBg: '#060e1a',
    shimmer1: '#0b1e30',
    shimmer2: '#102840',
    errorBg: '#120606',
    errorBorder: '#2a0f0f',
    spinnerShadow: 'inset 0 0 40px rgba(0,0,0,0.7)',
  },
  light: {
    id: 'light',
    label: 'Light',
    swatch: '#f4f4f8',
    bg: '#f4f4f8',
    surface: '#ffffff',
    deep: '#f8f8fc',
    border: '#dddde8',
    borderSubtle: '#c8c8d8',
    text: '#0a0a14',
    textMuted: '#6b6b8a',
    textDim: '#5a5a78',
    rowAlt: '#f0f0f6',
    navBg: 'rgba(244,244,248,0.92)',
    inputBg: '#ffffff',
    shimmer1: '#e8e8f0',
    shimmer2: '#d8d8e8',
    errorBg: '#fff0f0',
    errorBorder: '#f0cccc',
    spinnerShadow: 'inset 0 0 30px rgba(0,0,0,0.06)',
  },
}

const ThemeContext = createContext(THEMES.dark)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.light)
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
