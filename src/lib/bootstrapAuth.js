// src/lib/bootstrapAuth.js
import API from "../config/api";
import { signInSuccess } from "../redux/user/userSlice";
import apiFetch from "./apiFetch";

export const bootstrapAuth = () => async (dispatch) => {
  try {
    const res = await apiFetch(`${API}/auth/me`, { suppressRedirect: true });
    if (res.ok) {
      const user = await res.json();
      dispatch(signInSuccess(user));
    }
  } catch {}
};
