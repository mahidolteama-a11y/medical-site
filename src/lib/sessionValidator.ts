export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const clearInvalidSession = () => {
  const SESSION_KEY = 'medical_portal_session';
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      const session = JSON.parse(sessionData);
      if (session?.user?.id && !isValidUUID(session.user.id)) {
        console.warn('Detected invalid user ID format in session. Clearing...');
        localStorage.removeItem(SESSION_KEY);
        return true;
      }
    }
  } catch (error) {
    console.error('Error validating session:', error);
  }
  return false;
};
