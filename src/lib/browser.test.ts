import { describe, it, expect } from 'vitest';
import { classifyBrowser } from './browser';

describe('classifyBrowser', () => {
  it('riconosce i browser veri, anche quelli che si spacciano per Chrome', () => {
    expect(classifyBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15')).toBe('safari');
    expect(classifyBrowser('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')).toBe('chromium');
    expect(classifyBrowser('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0')).toBe('chromium');
    expect(classifyBrowser('Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition GX)')).toBe('other');
    expect(classifyBrowser('Mozilla/5.0 (Macintosh; rv:140.0) Gecko/20100101 Firefox/140.0')).toBe('other');
  });
});
