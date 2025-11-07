import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ContactPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "contact" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData(e.currentTarget);
      // TODO: replace with your backend endpoint
      // await fetch("/api/contact", { method: "POST", body: formData });
      await new Promise((r) => setTimeout(r, 600));
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-gray-600">{t("subtitle")}</p>

      <p className="mt-6 text-gray-700">{t("description")}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                {t("form.name")}
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                {t("form.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="subject"
              >
                {t("form.subject")}
              </label>
              <input
                id="subject"
                name="subject"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="message"
              >
                {t("form.message")}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <button
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border bg-blue-600 text-white px-4 py-2 disabled:opacity-60"
            >
              {loading ? "…" : t("form.submit")}
            </button>
            {status === "success" && (
              <p className="text-green-700 text-sm">{t("form.success")}</p>
            )}
            {status === "error" && (
              <p className="text-red-700 text-sm">{t("form.error")}</p>
            )}
          </div>
        </form>

        <aside className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">
            {t("altChannelsTitle")}
          </h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              {t("altChannels.0", { contactEmail: "contact@aqardot.com" })}
            </li>
            <li>{t("altChannels.1")}</li>
          </ul>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              <span className="font-medium">{t("emailLabel")}:</span>{" "}
              {t("emailValue", { contactEmail: "contact@aqardot.com" })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
