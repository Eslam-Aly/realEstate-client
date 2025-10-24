import { useTranslation } from "react-i18next";
export default function LangSwitch() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const nextLang = currentLang === "en" ? "ar" : "en";

  return (
    <button
      onClick={() => i18n.changeLanguage(nextLang)}
      className="text-sm  text-white  cursor-pointer hover:scale-105 transition-transform"
    >
      {nextLang.toUpperCase()}
    </button>
  );
}
