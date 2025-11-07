import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import arCommon from "./locales/ar/common.json";
import enNav from "./locales/en/nav.json";
import arNav from "./locales/ar/nav.json";
import enCreateListing from "./locales/en/createListing.json";
import arCreateListing from "./locales/ar/createListing.json";
import enSearch from "./locales/en/search.json";
import arSearch from "./locales/ar/search.json";
import enListing from "./locales/en/listing.json";
import arListing from "./locales/ar/listing.json";
import enFavorites from "./locales/en/favorites.json";
import arFavorites from "./locales/ar/favorites.json";
import enProfile from "./locales/en/profile.json";
import arProfile from "./locales/ar/profile.json";
import enUpdateListing from "./locales/en/updateListing.json";
import arUpdateListing from "./locales/ar/updateListing.json";
import enAuth from "./locales/en/auth.json";
import arAuth from "./locales/ar/auth.json";
import enFooter from "./locales/en/footer.json";
import arFooter from "./locales/ar/footer.json";
import enAbout from "./locales/en/about.json";
import arAbout from "./locales/ar/about.json";
import enContact from "./locales/en/contact.json";
import arContact from "./locales/ar/contact.json";
import enCareers from "./locales/en/careers.json";
import arCareers from "./locales/ar/careers.json";
import enImpressum from "./locales/en/impressum.json";
import arImpressum from "./locales/ar/impressum.json";
import enPrivacy from "./locales/en/privacy.json";
import arPrivacy from "./locales/ar/privacy.json";
import enTerms from "./locales/en/terms.json";
import arTerms from "./locales/ar/terms.json";

const mergeTranslations = (chunks, extra = {}) =>
  chunks.reduce((acc, chunk) => ({ ...acc, ...chunk }), { ...extra });

const enModules = [
  enCommon,
  enNav,
  enCreateListing,
  enSearch,
  enListing,
  enFavorites,
  enProfile,
  enUpdateListing,
  enAuth,
  enFooter,
];

const arModules = [
  arCommon,
  arNav,
  arCreateListing,
  arSearch,
  arListing,
  arFavorites,
  arProfile,
  arUpdateListing,
  arAuth,
  arFooter,
];

const resources = {
  en: {
    translation: mergeTranslations(enModules, {
      about: enAbout,
      contact: enContact,
      careers: enCareers,
      impressum: enImpressum,
      privacy: enPrivacy,
      terms: enTerms,
    }),
  },
  ar: {
    translation: mergeTranslations(arModules, {
      about: arAbout,
      contact: arContact,
      careers: arCareers,
      impressum: arImpressum,
      privacy: arPrivacy,
      terms: arTerms,
    }),
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});
export default i18n;
