import { validateEmail } from '../validation';

describe('Production Email Address Validation System', () => {
  describe('1. Valid Email Addresses', () => {
    it('accepts standard valid email address', () => {
      const result = validateEmail('john.doe@example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('john.doe@example.com');
    });

    it('accepts email with plus addressing (tags)', () => {
      const result = validateEmail('user+newsletter@sub.domain.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('user+newsletter@sub.domain.com');
    });

    it('accepts email with multiple subdomains', () => {
      const result = validateEmail('admin@mail.server.co.in');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('admin@mail.server.co.in');
    });

    it('accepts uppercase emails and normalizes domain to lowercase', () => {
      const result = validateEmail('John.Doe@EXAMPLE.COM');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('John.Doe@example.com');
    });

    it('accepts email with allowed special characters in local part', () => {
      const result = validateEmail("user.name+tag_123-special!#$%&'*+/=?^`{|}~@example-domain.org");
      expect(result.isValid).toBe(true);
    });

    it('trims leading and trailing whitespace automatically', () => {
      const result = validateEmail('   alex@cravingza.app   ');
      expect(result.isValid).toBe(true);
      expect(result.normalizedEmail).toBe('alex@cravingza.app');
    });
  });

  describe('2. Invalid & Malformed Emails', () => {
    it('rejects empty input or whitespace only', () => {
      expect(validateEmail('').isValid).toBe(false);
      expect(validateEmail('   ').isValid).toBe(false);
    });

    it('rejects emails containing internal spaces', () => {
      const result = validateEmail('john doe@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot contain spaces');
    });

    it('rejects email missing @ symbol', () => {
      const result = validateEmail('john.doe.example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('must contain an "@" symbol');
    });

    it('rejects email with multiple @ symbols', () => {
      const result = validateEmail('john@doe@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot contain more than one "@" symbol');
    });

    it('rejects email with missing username (local part)', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('username before "@" is missing');
    });

    it('rejects email with missing domain part', () => {
      const result = validateEmail('john@');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('domain after "@" is missing');
    });

    it('rejects email with leading dot in local part', () => {
      const result = validateEmail('.john@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot start with a dot');
    });

    it('rejects email with trailing dot in local part', () => {
      const result = validateEmail('john.@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('cannot end with a dot');
    });

    it('rejects consecutive dots in local part', () => {
      const result = validateEmail('john..doe@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('consecutive dots');
    });

    it('rejects domain missing TLD', () => {
      const result = validateEmail('john@example');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('must include a valid top-level domain');
    });

    it('rejects domain starting or ending with a dot', () => {
      expect(validateEmail('john@.example.com').isValid).toBe(false);
      expect(validateEmail('john@example.com.').isValid).toBe(false);
    });

    it('rejects domain with consecutive dots', () => {
      const result = validateEmail('john@example..com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('consecutive dots');
    });

    it('rejects domain label starting or ending with hyphen', () => {
      expect(validateEmail('john@-example.com').isValid).toBe(false);
      expect(validateEmail('john@example-.com').isValid).toBe(false);
    });

    it('rejects numeric TLD or TLD less than 2 characters', () => {
      expect(validateEmail('john@example.123').isValid).toBe(false);
      expect(validateEmail('john@example.a').isValid).toBe(false);
    });
  });

  describe('3. Length & Limit Rules', () => {
    it('rejects email longer than 254 characters overall', () => {
      const longLocal = 'a'.repeat(64);
      const longDomain = 'b'.repeat(60) + '.' + 'c'.repeat(60) + '.' + 'd'.repeat(60) + '.' + 'e'.repeat(60) + '.com';
      const result = validateEmail(`${longLocal}@${longDomain}`);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too long');
    });

    it('rejects local part longer than 64 characters', () => {
      const longLocal = 'a'.repeat(65);
      const result = validateEmail(`${longLocal}@example.com`);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('username before "@" is too long');
    });

    it('rejects domain label longer than 63 characters', () => {
      const longLabel = 'a'.repeat(64);
      const result = validateEmail(`user@${longLabel}.com`);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('too long');
    });
  });

  describe('4. Non-ASCII & Disposable Email Handling', () => {
    it('rejects non-ASCII / internationalized characters with clear message', () => {
      const result = validateEmail('jöhn@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('non-ASCII characters are not supported');
    });

    it('blocks disposable emails when blockDisposable option is enabled', () => {
      const result = validateEmail('user@mailinator.com', { blockDisposable: true });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Disposable or temporary email addresses are not allowed');
    });

    it('allows disposable emails by default if blockDisposable is false', () => {
      const result = validateEmail('user@mailinator.com');
      expect(result.isValid).toBe(true);
    });
  });
});
