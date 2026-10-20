import { lastApproverComment, leaveTint } from '../tint';

describe('leaveTint', () => {
  it('maps the known types and falls back to neutral', () => {
    expect(leaveTint('annual')).toEqual({ bg: 'infoBg', fg: 'infoFg' });
    expect(leaveTint('sick')).toEqual({ bg: 'successBg', fg: 'successFg' });
    expect(leaveTint('family')).toEqual({ bg: 'purpleBg', fg: 'purpleFg' });
    expect(leaveTint('unpaid')).toEqual({ bg: 'grayBg', fg: 'grayFg' });
    expect(leaveTint('anything-else')).toEqual({ bg: 'grayBg', fg: 'grayFg' });
  });
});

describe('lastApproverComment', () => {
  it('returns the latest approver comment, ignoring the employee’s own', () => {
    const timeline = [
      { action: 'submitted', comment: 'Family trip' },
      { action: 'recommended' },
      { action: 'changes_requested', comment: 'Please shorten' },
    ];
    expect(lastApproverComment(timeline)).toBe('Please shorten');
  });
  it('is undefined when nobody commented', () => {
    expect(lastApproverComment([{ action: 'submitted' }, { action: 'approved' }])).toBeUndefined();
  });
});
