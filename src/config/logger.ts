function isDebugEnabledFromEnv(): boolean {
  const value = import.meta.env.VITE_LOG_DEBUG;
  if (value == null || value.trim() === '') {
    return true;
  }

  return value.trim().toLowerCase() !== 'false';
}

export const loggerConfig = {
  debugEnabled: isDebugEnabledFromEnv(),
};
