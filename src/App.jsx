import "./index.css";
import React from "react";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Profile from "./pages/Profile.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import CreateListing from "./pages/CreateListing.jsx";
import UpdateListing from "./pages/UpdateListing.jsx";
import Listing from "./pages/Listing.jsx";
import Search from "./pages/Search.jsx";
import CreateListingForm from "./pages/CreateListingForm.jsx";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/listing/:createdId" element={<Listing />} />
        <Route path="/search" element={<Search />} />
        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route
            path="/update-listing/:listingId"
            element={<UpdateListing />}
          />
        </Route>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/createlistingform" element={<CreateListingForm />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
