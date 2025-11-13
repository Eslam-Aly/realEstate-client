const ERROR_MAP = {
  "Invalid email or password!": "auth.errorInvalidCredentials",
  "user not found!": "auth.errorUserNotFound",
  "Please verify your email before logging in": "auth.errorEmailNotVerified",
  "email and password are required": "auth.errorMissingCredentials",
  "username, email and password are required": "auth.errorMissingFields",
};

/**
 * Returns a localized version of known API error messages.
 * Falls back to the original message if no translation key exists.
 */
export function mapApiErrorMessage(message, t) {
  if (!message) return "";
  const normalized = String(message).trim();
  if (!normalized) return "";

  if (normalized.endsWith("is already taken")) {
    return t("auth.errorUserExists");
  }

  const translationKey = ERROR_MAP[normalized];
  if (translationKey) {
    return t(translationKey);
  }

  return normalized;
}
