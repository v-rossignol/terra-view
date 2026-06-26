import { describe, expect, it } from 'vitest';
import { LOGIN_PATH, UNAUTHORIZED_ERROR_MESSAGE } from '../../src/utils/authErrors';

describe('authErrors', () => {
  it('includes the Stellar Gate login path in the unauthorized message', () => {
    expect(UNAUTHORIZED_ERROR_MESSAGE).toContain(LOGIN_PATH);
    expect(UNAUTHORIZED_ERROR_MESSAGE).toContain('not signed in');
  });
});
