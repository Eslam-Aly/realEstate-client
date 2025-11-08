import React from "react";
import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "terms" });
  const useItems = t("use.items", { returnObjects: true }) || [];
  const listItems = t("listings.items", { returnObjects: true }) || [];

  return (
    <div className=" mx-auto max-w-4xl px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-blue-700">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {t("lastUpdated", {
            lastUpdated: new Date().toISOString().slice(0, 10),
          })}
        </p>
      </div>

      <div className="flex flex-col gap-3 prose prose-gray max-w-none mt-6">
        <p>{t("intro")}</p>
        <div>
          <h2 className="text-lg font-bold">{t("use.title")}</h2>
          <ul>
            {useItems.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("listings.title")}</h2>
          <ul>
            {listItems.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("payments.title")}</h2>
          <p>{t("payments.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("disclaimer.title")}</h2>
          <p>{t("disclaimer.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("liability.title")}</h2>
          <p>{t("liability.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("termination.title")}</h2>
          <p>{t("termination.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("changes.title")}</h2>
          <p>{t("changes.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("contact.title")}</h2>
          <p>{t("contact.body")}</p>
        </div>
      </div>
    </div>
  );
}
