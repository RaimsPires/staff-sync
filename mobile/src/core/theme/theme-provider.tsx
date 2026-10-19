import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/core/settings/settings-store';

import { darkColors, lightColors, type ThemeColors } from './tokens';

type Theme = { colors: ThemeColors; isDark: boolean };

const ThemeContext = createContext<Theme>({ colors: lightColors, isDark: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSettings((s) => s.theme);
  const system = useColorScheme();
  const isDark = preference === 'system' ? system === 'dark' : preference === 'dark';

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
