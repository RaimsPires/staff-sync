export type ThemeColors = {
  bg: string;
  ink: string;
  muted: string;
  card: string;
  line: string;
  /** Stronger outline for inputs and code boxes. */
  fieldBorder: string;
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
  purpleBg: string;
  purpleFg: string;
  orangeBg: string;
  orangeFg: string;
  grayBg: string;
  grayFg: string;
  successBorder: string;
  warningBorder: string;
  dangerBorder: string;
  infoBorder: string;
  grayBorder: string;
  /** Red used for flag glyphs and "missing" values. */
  flag: string;
  /** Unread row tint (notifications). */
  unreadBg: string;
  /** Future / weekend day text and disabled button fill. */
  faint: string;
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
  fieldBorder: '#B8C6DB',
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
  purpleBg: '#EDE9FE',
  purpleFg: '#5B21B6',
  orangeBg: '#FFEDD5',
  orangeFg: '#9A3412',
  grayBg: '#E8ECF2',
  grayFg: '#374151',
  successBorder: '#B5E3C4',
  warningBorder: '#F3DC9A',
  dangerBorder: '#F4B8B8',
  infoBorder: '#C5D8F5',
  grayBorder: '#CDD5E0',
  flag: '#B91C1C',
  unreadBg: '#F0F6FF',
  faint: '#8A98AE',
};

export const darkColors: ThemeColors = {
  ...shared,
  bg: '#0B1220',
  ink: '#F4F7FB',
  muted: '#A9B6CA',
  card: '#142036',
  line: '#26385A',
  fieldBorder: '#3A4F76',
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
  purpleBg: '#2A1B4D',
  purpleFg: '#C4B5FD',
  orangeBg: '#431F0A',
  orangeFg: '#FDBA74',
  grayBg: '#222E44',
  grayFg: '#CBD5E1',
  successBorder: '#1B5E3A',
  warningBorder: '#6B4A12',
  dangerBorder: '#7A2323',
  infoBorder: '#1E4380',
  grayBorder: '#3A4A66',
  flag: '#F87171',
  unreadBg: '#122440',
  faint: '#6B7C99',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const radius = { sm: 8, md: 12, field: 14, button: 16, row: 18, lg: 20, hero: 22, sheet: 28, pill: 999 } as const;

/** Fixed-dark palette for camera / scanner screens; identical in light and dark mode. */
export const cameraColors = {
  bg: '#101826',
  panel: '#1B2638',
  text: '#FFFFFF',
  sub: '#C9D4E5',
  accent: '#0BC152',
  scan: '#5FA8FF',
  navy: '#0B2A52',
  white: '#FFFFFF',
  primary: '#0A6AE6',
  /** Text on the bright-green accent (toast "Check in" button). */
  onAccent: '#06280F',
  /** Secondary text on the navy splash. */
  subOnNavy: '#C9D6EA',
} as const;

/** Minimum touch target (Apple HIG / Material guidance). */
export const MIN_TOUCH = 44;

export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 35 },
  title: { fontSize: 26, fontWeight: '800', lineHeight: 31 },
  heading: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  subheading: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', lineHeight: 16, letterSpacing: 0.5 },
  small: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  lead: { fontSize: 17, fontWeight: '800', lineHeight: 22 },
  section: { fontSize: 19, fontWeight: '800', lineHeight: 24 },
  hero: { fontSize: 22, fontWeight: '800', lineHeight: 27 },
  headline: { fontSize: 24, fontWeight: '800', lineHeight: 29 },
  result: { fontSize: 28, fontWeight: '800', lineHeight: 33 },
} as const;

export type TypographyVariant = keyof typeof typography;
