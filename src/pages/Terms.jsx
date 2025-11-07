import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "terms" });
  const useItems = t("use.items", { returnObjects: true }) || [];
  const listItems = t("listings.items", { returnObjects: true }) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {t("lastUpdated", {
          lastUpdated: new Date().toISOString().slice(0, 10),
        })}
      </p>

      <div className="prose prose-gray max-w-none mt-6">
        <p>{t("intro")}</p>

        <h2>{t("use.title")}</h2>
        <ul>
          {useItems.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        <h2>{t("listings.title")}</h2>
        <ul>
          {listItems.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        <h2>{t("payments.title")}</h2>
        <p>{t("payments.body")}</p>

        <h2>{t("disclaimer.title")}</h2>
        <p>{t("disclaimer.body")}</p>

        <h2>{t("liability.title")}</h2>
        <p>{t("liability.body")}</p>

        <h2>{t("termination.title")}</h2>
        <p>{t("termination.body")}</p>

        <h2>{t("changes.title")}</h2>
        <p>{t("changes.body")}</p>

        <h2>{t("contact.title")}</h2>
        <p>{t("contact.body", { legalEmail: "legal@aqardot.com" })}</p>
      </div>
    </div>
  );
}
