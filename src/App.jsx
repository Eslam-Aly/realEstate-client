import "./index.css";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home.jsx";
import AboutPage from "./pages/About.jsx";
import Profile from "./pages/Profile.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Header from "./components/Header.jsx";
import UpdateListing from "./pages/UpdateListing.jsx";
import Listing from "./pages/Listing.jsx";
import Search from "./pages/Search.jsx";
import CreateListingForm from "./pages/CreateListingForm.jsx";
import Footer from "./components/Footer.jsx";
import AppBoot from "./components/AppBoot.jsx";
import Favorites from "./pages/Favorites.jsx";
import CareersPage from "./pages/Careers.jsx";
import ContactPage from "./pages/Contact.jsx";
import PrivacyPage from "./pages/Privacy.jsx";
import TermsPage from "./pages/Terms.jsx";
import ImpressumPage from "./pages/Impressum.jsx";

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || "en";
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);
  return (
    <BrowserRouter>
      <AppBoot />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listing/:createdId" element={<Listing />} />
        <Route path="/search" element={<Search />} />
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/update-listing/:listingId"
            element={<UpdateListing />}
          />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/createlistingform" element={<CreateListingForm />} />
        </Route>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/impressum" element={<ImpressumPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
export default App;
