import React from "react";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "about" });
  const values = t("values", { returnObjects: true }) || [];
  const howItWorks = t("howItWorks", { returnObjects: true }) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-gray-600">{t("tagline")}</p>

      <div className="prose prose-gray max-w-none mt-6">
        <p>{t("intro")}</p>

        <h2>{t("missionTitle")}</h2>
        <p>{t("missionBody")}</p>

        <h2>{t("valuesTitle")}</h2>
        <ul>
          {values.map((v, i) => (
            <li key={i}>
              <strong>{v.name}:</strong> {v.desc}
            </li>
          ))}
        </ul>

        <h2>{t("howItWorksTitle")}</h2>
        <ol>
          {howItWorks.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>

        <h2>{t("ctaTitle")}</h2>
        <p>{t("ctaBody")}</p>
        <a
          href="/contact"
          className="inline-flex items-center rounded-2xl px-4 py-2 border bg-white hover:bg-gray-50 shadow-sm mt-2"
        >
          {t("contactButton")}
        </a>
      </div>
    </div>
  );
}
