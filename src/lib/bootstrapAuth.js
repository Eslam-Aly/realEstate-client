// src/lib/bootstrapAuth.js
import API from "../config/api";
import { signInSuccess } from "../redux/user/userSlice";

export const bootstrapAuth = () => async (dispatch) => {
  try {
    const res = await fetch(`${API}/auth/me`, { credentials: "include" });
    if (res.ok) {
      const user = await res.json();
      dispatch(signInSuccess(user));
    }
  } catch {}
};
