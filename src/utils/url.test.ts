import { extractSubdomainsWithNoTld } from '@/utils/url';
import { describe, expect, it } from 'vitest';

describe('extractSubdomainsWithNoTld', () => {
  it('strips only the last label of the hostname', () => {
    expect(extractSubdomainsWithNoTld('https://app.example.com')).toBe('app.example');
  });

  it('treats www as no subdomain', () => {
    expect(extractSubdomainsWithNoTld('https://www.example.com')).toBe('example');
  });

  it('treats www as no subdomain for multiple subdomains', () => {
    expect(extractSubdomainsWithNoTld('https://www.app.example.com')).toBe('app.example');
  });

  it('keeps www when it is the only label before the tld', () => {
    expect(extractSubdomainsWithNoTld('https://www.com')).toBe('www');
  });

  it('keeps deeply nested subdomains', () => {
    expect(extractSubdomainsWithNoTld('https://sub.app.example.com')).toBe('sub.app.example');
  });

  it('returns the leading label for a bare domain', () => {
    expect(extractSubdomainsWithNoTld('https://example.com')).toBe('example');
  });

  it('ignores path, query, and hash', () => {
    expect(extractSubdomainsWithNoTld('https://example.com/foo?bar=1#x')).toBe('example');
  });

  it('ignores the port', () => {
    expect(extractSubdomainsWithNoTld('https://app.example.com:8080')).toBe('app.example');
  });

  it('lowercases the hostname', () => {
    expect(extractSubdomainsWithNoTld('https://APP.EXAMPLE.COM')).toBe('app.example');
  });

  it('returns an empty string for a single-label host', () => {
    expect(extractSubdomainsWithNoTld('http://localhost')).toBe('');
  });

  it('does not handle compound TLDs (strips only the final label)', () => {
    expect(extractSubdomainsWithNoTld('https://example.co.uk')).toBe('example.co');
  });

  it('naively splits IP address hosts', () => {
    expect(extractSubdomainsWithNoTld('http://192.168.1.1')).toBe('192.168.1');
  });

  it('throws on an invalid URL', () => {
    expect(() => extractSubdomainsWithNoTld('not-a-url')).toThrow();
  });
});
