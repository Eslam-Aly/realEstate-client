import React from "react";
import { useTranslation } from "react-i18next";

export default function PrivacyPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "privacy" });
  const dataWeCollect = t("dataWeCollect.items", { returnObjects: true }) || [];
  const useOfData = t("useOfData.items", { returnObjects: true }) || [];
  const legalBasis = t("legalBasis.items", { returnObjects: true }) || [];
  const yourRights = t("yourRights.items", { returnObjects: true }) || [];

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

        <h2>{t("controller.title")}</h2>
        <p>{t("controller.body")}</p>

        <h2>{t("dataWeCollect.title")}</h2>
        <ul>
          {dataWeCollect.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        <h2>{t("useOfData.title")}</h2>
        <ul>
          {useOfData.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        <h2>{t("legalBasis.title")}</h2>
        <ul>
          {legalBasis.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>

        <h2>{t("sharing.title")}</h2>
        <p>{t("sharing.body")}</p>

        <h2>{t("retention.title")}</h2>
        <p>{t("retention.body")}</p>

        <h2>{t("security.title")}</h2>
        <p>{t("security.body")}</p>

        <h2>{t("yourRights.title")}</h2>
        <ul>
          {yourRights.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
        <p className="text-sm text-gray-600">
          {t("yourRights.contact", { privacyEmail: "privacy@aqardot.com" })}
        </p>

        <h2>{t("international.title")}</h2>
        <p>{t("international.body")}</p>

        <h2>{t("contact.title")}</h2>
        <p>{t("contact.body", { privacyEmail: "privacy@aqardot.com" })}</p>
      </div>
    </div>
  );
}
