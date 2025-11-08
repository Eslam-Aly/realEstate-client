import React from "react";
import { useTranslation } from "react-i18next";

export default function CareersPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "careers" });
  const values = t("values", { returnObjects: true }) || [];
  const perks = t("perks", { returnObjects: true }) || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-blue-700">
        {t("title")}
      </h1>
      <p className="mt-2 text-gray-700 text-lg">{t("hero")}</p>
      <p className="mt-2 text-gray-700">{t("intro")}</p>

      <div className="flex flex-col gap-2 prose prose-gray max-w-none mt-6">
        <h2 className="text-lg font-semibold">{t("valuesTitle")}</h2>
        <ul>
          {values.map((v, i) => (
            <li key={i}>
              <strong>{v.name}:</strong> {v.desc}
            </li>
          ))}
        </ul>

        <h2 className="text-lg font-semibold">{t("openingsTitle")}</h2>
        <div className="rounded-xl border bg-blue-50 p-4">
          <p>{t("noOpenings")}</p>
        </div>

        <h2 className="text-lg font-semibold">{t("perksTitle")}</h2>
        <ul className="list-disc list-inside">
          {perks.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>

        <p className="mt-6 font-medium ">{t("cta")}</p>
      </div>
    </div>
  );
}
