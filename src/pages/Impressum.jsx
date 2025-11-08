import React from "react";
import { useTranslation } from "react-i18next";

export default function ImpressumPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "impressum" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-blue-700">
        {t("title")}
      </h1>
      <p className="mt-2 text-gray-500">{t("note")}</p>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm text-gray-900">
        <Row
          label={t("legalNameLabel")}
          value={t("legalName", { legalName: "Eslam Aly" })}
        />
        <Row
          label={t("streetAddressLabel")}
          value={t("streetAddress", { streetAddress: "—" })}
        />
        <Row
          label={t("cityPostalLabel")}
          value={t("cityPostal", { cityPostal: "—" })}
        />
        <Row label={t("countryLabel")} value={t("country")} />
        <Row
          label={t("emailLabel")}
          value={t("email", { legalEmail: "legal@aqardot.com" })}
        />
        <Row
          label={t("phoneLabel")}
          value={t("phone", { phoneOptional: "—" })}
        />
        <Row
          label={t("responsiblePersonLabel")}
          value={t("responsiblePerson")}
        />
      </div>

      <div className="prose prose-gray max-w-none mt-6">
        <h2 className="font-semibold">{t("disclaimerTitle")}</h2>
        <p>{t("disclaimerBody")}</p>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-40 shrink-0 text-sm text-gray-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
