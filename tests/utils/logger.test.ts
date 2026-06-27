import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loggerConfig } from '../../src/config/logger';
import { Logger } from '../../src/utils/logger';

describe('Logger', () => {
  let initialDebugEnabled: boolean;

  beforeEach(() => {
    initialDebugEnabled = loggerConfig.debugEnabled;
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    loggerConfig.debugEnabled = initialDebugEnabled;
    vi.restoreAllMocks();
  });

  it('writes debug messages when debug is enabled', () => {
    loggerConfig.debugEnabled = true;

    const log = new Logger('Test');
    log.debug('hello');

    expect(console.debug).toHaveBeenCalledWith('[Test] hello');
  });

  it('skips debug messages when debug is disabled', () => {
    loggerConfig.debugEnabled = false;

    const log = new Logger('Test');
    log.debug('hello');

    expect(console.debug).not.toHaveBeenCalled();
  });

  it('still writes non-debug levels when debug is disabled', () => {
    loggerConfig.debugEnabled = false;

    const log = new Logger('Test');
    log.warn('careful');

    expect(console.warn).toHaveBeenCalledWith('[Test] careful');
  });
});
