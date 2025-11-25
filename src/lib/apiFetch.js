import API from "../config/api";
const REFRESH_URL = `${API}/auth/refresh`;

let refreshPromise = null;
let forcedLogout = false;
let logoutHandler = null;
const LOGOUT_THROTTLE_KEY = "aqd_last_logout_ts";
const LOGOUT_THROTTLE_MS = 3000;

export const registerApiAuthHandler = (handler) => {
  logoutHandler = handler;
};

const shouldRedirect = () => {
  try {
    const last = Number(sessionStorage.getItem(LOGOUT_THROTTLE_KEY) || 0);
    const now = Date.now();
    if (now - last < LOGOUT_THROTTLE_MS) return false;
    sessionStorage.setItem(LOGOUT_THROTTLE_KEY, String(now));
    return true;
  } catch {
    return true;
  }
};

const hardLogout = () => {
  if (forcedLogout) return;
  forcedLogout = true;
  if (typeof logoutHandler === "function") {
    try {
      logoutHandler();
    } catch (err) {
      console.error("Failed to run logout handler", err);
    }
  }
  if (
    shouldRedirect() &&
    !["/signin", "/signup"].includes(window.location.pathname)
  ) {
    window.location.replace("/signin");
  }
};

const performRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    }).then((res) => {
      if (!res.ok) {
        throw new Error("Refresh failed");
      }
      return res;
    });

    refreshPromise.finally(() => {
      refreshPromise = null;
    });
    // Attach a no-op catcher so tests don't see unhandled rejections if callers drop the promise.
    refreshPromise.catch(() => {});
  }

  return refreshPromise;
};

/**
 * Thin wrapper around fetch that automatically retries once after attempting
 * /auth/refresh on a 401 response. If refresh fails, it clears local auth
 * state and redirects to /signin.
 */
const apiFetch = async (input, init = {}) => {
  const preparedInit = { credentials: "include", ...init };
  const isRefreshCall =
    typeof input === "string" && input.includes("/auth/refresh");
  const response = await fetch(input, preparedInit);

  if (response.status !== 401 || init.__isRetry || isRefreshCall) {
    return response;
  }

  try {
    await performRefresh();
    return fetch(input, {
      ...preparedInit,
      __isRetry: true,
    });
  } catch (err) {
    hardLogout();
    return response;
  }
};

export default apiFetch;
