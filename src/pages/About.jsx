import React from "react";
import { useTranslation } from "react-i18next";

export default function AboutPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "about" });
  const values = t("values", { returnObjects: true }) || [];
  const howItWorks = t("howItWorks", { returnObjects: true }) || [];

  return (
    <div className=" mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-blue-700">
        {t("title")}
      </h1>
      <p className="mt-2 text-gray-600">{t("tagline")}</p>

      <div className="prose prose-gray max-w-none mt-6 flex flex-col gap-4">
        <p>{t("intro")}</p>
        <div>
          <h2 className="font-bold">{t("missionTitle")}</h2>
          <p>{t("missionBody")}</p>
        </div>
        <div>
          <h2 className="font-bold">{t("valuesTitle")}</h2>
          <ul>
            {values.map((v, i) => (
              <li key={i}>
                <strong>{v.name}:</strong> {v.desc}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold">{t("howItWorksTitle")}</h2>
          <ol>
            {howItWorks.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="font-bold">{t("ctaTitle")}</h2>
          <p>{t("ctaBody")}</p>
        </div>
        <a
          href="/contact"
          className="inline-flex items-center rounded-lg px-4 py-2 border bg-blue-700 hover:bg-blue-800 shadow-sm mt-2 text-white transition md:w-36 justify-center w-auto"
        >
          {t("contactButton")}
        </a>
      </div>
    </div>
  );
}
