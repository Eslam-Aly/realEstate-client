// src/features/auth/ResetPassword.jsx
import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import API from "../config/api.js";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const lang = (params.get("lang") || "en").toLowerCase();
  const isAr = lang === "ar";

  const [pwd, setPwd] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        body: JSON.stringify({ token, newPassword: pwd }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      setStatus("done");
    } catch (err) {
      setStatus(err.message || "error");
    }
  }

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">
        {isAr ? "إعادة تعيين كلمة المرور" : "Reset Password"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          className="border p-2 w-full"
          placeholder={isAr ? "كلمة مرور جديدة" : "New password"}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button className="bg-black text-white px-4 py-2 rounded">
          {isAr ? "تحديث" : "Update"}
        </button>
      </form>

      {status === "loading" && <p>{isAr ? "جارٍ التحديث…" : "Updating…"}</p>}
      {status === "done" && (
        <p>
          {isAr ? "تم تحديث كلمة المرور. " : "Password updated. "}
          <Link to="/signin" className="underline">
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </p>
      )}
      {status && !["loading", "done"].includes(status) && (
        <p style={{ color: "crimson" }}>{status}</p>
      )}
    </div>
  );
}
