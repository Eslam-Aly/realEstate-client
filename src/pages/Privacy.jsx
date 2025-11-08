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
      <h1 className="text-3xl font-bold tracking-tight text-blue-700">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-gray-400">
        {t("lastUpdated", {
          lastUpdated: new Date().toISOString().slice(0, 10),
        })}
      </p>

      <div className="flex flex-col gap-4 prose prose-gray max-w-none mt-6">
        <p>{t("intro")}</p>
        <div>
          <h2 className="text-lg font-bold">{t("controller.title")}</h2>
          <p>{t("controller.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("dataWeCollect.title")}</h2>
          <ul>
            {dataWeCollect.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("useOfData.title")}</h2>
          <ul>
            {useOfData.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("legalBasis.title")}</h2>
          <ul>
            {legalBasis.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("sharing.title")}</h2>
          <p>{t("sharing.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("retention.title")}</h2>
          <p>{t("retention.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("security.title")}</h2>
          <p>{t("security.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("yourRights.title")}</h2>
          <ul>
            {yourRights.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-gray-600">{t("yourRights.contact")}</p>
        <div>
          <h2 className="text-lg font-bold">{t("international.title")}</h2>
          <p>{t("international.body")}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">{t("contact.title")}</h2>
          <p>{t("contact.body")}</p>
        </div>
      </div>
    </div>
  );
}
