// src/features/auth/Verified.jsx
import { useSearchParams, Link } from "react-router-dom";

export default function Verified() {
  const [params] = useSearchParams();
  const lang = (params.get("lang") || "en").toLowerCase();
  const isAr = lang === "ar";

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="max-w-md mx-auto p-6 space-y-2">
      <h1 className="text-xl font-semibold">
        {isAr ? "تم تأكيد البريد الإلكتروني" : "Email verified"}
      </h1>
      <p>
        {isAr
          ? "تم تأكيد حسابك بنجاح."
          : "Your account has been verified successfully."}
      </p>
      <Link to="/signin" className="underline">
        {isAr ? "تسجيل الدخول إلى حسابك" : "Sign in to your account"}
      </Link>
    </div>
  );
}
