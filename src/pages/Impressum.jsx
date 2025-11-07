import React from "react";
import { useTranslation } from "react-i18next";

export default function ImpressumPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "impressum" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm text-gray-900">
        <Row
          label="Legal Name"
          value={t("legalName", { legalName: "Eslam Aly" })}
        />
        <Row
          label="Address"
          value={t("streetAddress", { streetAddress: "—" })}
        />
        <Row
          label="City / Postal"
          value={t("cityPostal", { cityPostal: "—" })}
        />
        <Row label="Country" value={t("country")} />
        <Row
          label="Email"
          value={t("email", { legalEmail: "legal@aqardot.com" })}
        />
        <Row label="Phone" value={t("phone", { phoneOptional: "—" })} />
        <Row
          label="Responsible"
          value={t("responsiblePerson", { responsiblePerson: "Eslam Aly" })}
        />
      </div>

      <div className="prose prose-gray max-w-none mt-6">
        <h2>{t("disclaimerTitle")}</h2>
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
