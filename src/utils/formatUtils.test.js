import {
  formatCurrency,
  formatPercentage,
  formatTime,
  getOperationText,
  getAssetTypeText,
  getOperationColor,
} from './formatUtils';

describe('formatCurrency', () => {
  it('should format positive amount', () => {
    expect(formatCurrency(1234.56)).toBe('¥1234.56');
  });

  it('should format negative amount', () => {
    expect(formatCurrency(-1234.56)).toBe('¥-1234.56');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('¥0.00');
  });

  it('should handle null value', () => {
    expect(formatCurrency(null)).toBe('¥0.00');
  });

  it('should handle undefined value', () => {
    expect(formatCurrency(undefined)).toBe('¥0.00');
  });

  it('should use custom currency symbol', () => {
    expect(formatCurrency(1234.56, '$')).toBe('$1234.56');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('¥1234.57');
    expect(formatCurrency(1234.564)).toBe('¥1234.56');
  });
});

describe('formatPercentage', () => {
  it('should format positive percentage', () => {
    expect(formatPercentage(12.34)).toBe('12.34%');
  });

  it('should format negative percentage', () => {
    expect(formatPercentage(-12.34)).toBe('-12.34%');
  });

  it('should format zero', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });

  it('should handle null value', () => {
    expect(formatPercentage(null)).toBe('0%');
  });

  it('should handle undefined value', () => {
    expect(formatPercentage(undefined)).toBe('0%');
  });

  it('should use custom decimal places', () => {
    expect(formatPercentage(12.3456, 3)).toBe('12.346%');
    expect(formatPercentage(12.3456, 1)).toBe('12.3%');
    expect(formatPercentage(12.3456, 0)).toBe('12%');
  });
});

describe('formatTime', () => {
  beforeEach(() => {
    // Mock current date to 2024-01-15 12:00:00
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(formatTime(undefined)).toBe('');
  });

  it('should format today time (only show time)', () => {
    const today = new Date('2024-01-15T10:30:00');
    const result = formatTime(today);
    expect(result).toMatch(/10:30/);
  });

  it('should format this year date (show month, day and time)', () => {
    const thisYear = new Date('2024-03-20T14:45:00');
    const result = formatTime(thisYear);
    expect(result).toMatch(/03/);
    expect(result).toMatch(/20/);
    expect(result).toMatch(/14:45/);
  });

  it('should format previous year date (show full date)', () => {
    const lastYear = new Date('2023-12-25T09:15:00');
    const result = formatTime(lastYear);
    expect(result).toMatch(/23/);
    expect(result).toMatch(/12/);
    expect(result).toMatch(/25/);
  });

  it('should handle string timestamp', () => {
    const timestamp = '2024-01-15T10:30:00';
    const result = formatTime(timestamp);
    expect(result).toMatch(/10:30/);
  });
});

describe('getOperationText', () => {
  it('should return correct text for buy', () => {
    expect(getOperationText('buy')).toBe('买入');
  });

  it('should return correct text for sell', () => {
    expect(getOperationText('sell')).toBe('卖出');
  });

  it('should return correct text for initial', () => {
    expect(getOperationText('initial')).toBe('初始资金');
  });

  it('should return correct text for deposit', () => {
    expect(getOperationText('deposit')).toBe('追加资金');
  });

  it('should return correct text for withdraw', () => {
    expect(getOperationText('withdraw')).toBe('取出资金');
  });

  it('should return original value for unknown operation', () => {
    expect(getOperationText('unknown')).toBe('unknown');
  });
});

describe('getAssetTypeText', () => {
  it('should return correct text for stock', () => {
    expect(getAssetTypeText('stock')).toBe('股票');
  });

  it('should return correct text for future', () => {
    expect(getAssetTypeText('future')).toBe('期货');
  });

  it('should return correct text for fund', () => {
    expect(getAssetTypeText('fund')).toBe('基金');
  });

  it('should return original value for unknown asset type', () => {
    expect(getAssetTypeText('unknown')).toBe('unknown');
  });
});

describe('getOperationColor', () => {
  it('should return blue for initial', () => {
    expect(getOperationColor('initial')).toBe('blue');
  });

  it('should return green for deposit', () => {
    expect(getOperationColor('deposit')).toBe('green');
  });

  it('should return red for withdraw', () => {
    expect(getOperationColor('withdraw')).toBe('red');
  });

  it('should return red for buy', () => {
    expect(getOperationColor('buy')).toBe('red');
  });

  it('should return green for sell', () => {
    expect(getOperationColor('sell')).toBe('green');
  });

  it('should return default for unknown type', () => {
    expect(getOperationColor('unknown')).toBe('default');
  });
});
