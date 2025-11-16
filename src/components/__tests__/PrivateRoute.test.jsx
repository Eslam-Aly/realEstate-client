import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "../PrivateRoute.jsx";
import userReducer from "../../redux/user/userSlice.js";

function renderWithStore(currentUser) {
  const store = configureStore({
    reducer: {
      user: userReducer,
    },
    preloadedState: {
      user: {
        currentUser,
        user: null,
        error: null,
        loading: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>Protected</div>} />
          </Route>
          <Route path="/signin" element={<div>SignIn</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe("PrivateRoute", () => {
  it("renders protected content when user exists", () => {
    renderWithStore({ id: "123" });
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("redirects to signin when no user", async () => {
    renderWithStore(null);
    await waitFor(() => {
      expect(screen.getByText("SignIn")).toBeInTheDocument();
    });
  });
});
