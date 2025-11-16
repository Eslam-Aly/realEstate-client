import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import API from "../config/api.js";

export default function ContactPage() {
  const { t } = useTranslation(undefined, { keyPrefix: "contact" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.target);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setStatus("success");
        e.target.reset();
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-blue-700">
        {t("title")}
      </h1>
      <p className="mt-2 text-gray-600">{t("subtitle")}</p>

      <p className="mt-6 text-gray-700">{t("description")}</p>

      <form
        data-testid="contact-form"
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-white p-5 shadow-sm mt-2"
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
            <label className="block text-sm font-medium mb-1" htmlFor="subject">
              {t("form.subject")}
            </label>
            <input
              id="subject"
              name="subject"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="message">
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
            className="inline-flex items-center justify-center rounded-xl border bg-blue-700 hover:bg-blue-800 cursor-pointer transition text-white px-4 py-2 disabled:opacity-60"
          >
            {loading ? "…" : t("form.submit")}
          </button>
          {status === "success" && (
            <p data-testid="contact-success" className="text-green-700 text-sm">
              {t("form.success")}
            </p>
          )}
          {status === "error" && (
            <p data-testid="contact-error" className="text-red-700 text-sm">
              {t("form.error")}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
