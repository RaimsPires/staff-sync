export type ThemeColors = {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  line: string;
  soft: string;
  map: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  success: string;
  successBg: string;
  successFg: string;
  warning: string;
  warningBg: string;
  warningFg: string;
  danger: string;
  dangerBg: string;
  dangerFg: string;
  info: string;
  infoBg: string;
  infoFg: string;
  overlay: string;
};

const shared = {
  primary: '#0A6AE6',
  primaryPressed: '#0A4DA8',
  onPrimary: '#FFFFFF',
  success: '#0BC152',
  warning: '#B45309',
  danger: '#DC2626',
  info: '#0A6AE6',
  overlay: 'rgba(11,18,32,0.55)',
} as const;

export const lightColors: ThemeColors = {
  ...shared,
  bg: '#F5F8FC',
  ink: '#0B2A52',
  muted: '#51627D',
  card: '#FFFFFF',
  line: '#DCE4EF',
  soft: '#EEF3FA',
  map: '#CFE0F5',
  successBg: '#DCFCE7',
  successFg: '#14532D',
  warningBg: '#FEF3C7',
  warningFg: '#7C3A06',
  dangerBg: '#FEE2E2',
  dangerFg: '#991B1B',
  infoBg: '#E6EEFA',
  infoFg: '#0A4DA8',
};

export const darkColors: ThemeColors = {
  ...shared,
  bg: '#0B1220',
  ink: '#F4F7FB',
  muted: '#A9B6CA',
  card: '#142036',
  line: '#26385A',
  soft: '#1D2E4D',
  map: '#1B2B47',
  successBg: '#0E3B22',
  successFg: '#86EFAC',
  warningBg: '#3F2A08',
  warningFg: '#FCD34D',
  dangerBg: '#4A1414',
  dangerFg: '#FCA5A5',
  infoBg: '#10294F',
  infoFg: '#93C5FD',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Minimum touch target (Apple HIG / Material guidance). */
export const MIN_TOUCH = 44;

export const typography = {
  title: { fontSize: 26, fontWeight: '800', lineHeight: 31 },
  heading: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  subheading: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', lineHeight: 16, letterSpacing: 0.5 },
} as const;

export type TypographyVariant = keyof typeof typography;
