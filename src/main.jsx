import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { store, persistor } from "./redux/store.js";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import "./i18n";
import { registerApiAuthHandler } from "./lib/apiFetch.js";
import { signOutSuccess } from "./redux/user/userSlice.js";
import { clearFavorites } from "./redux/user/favoritesSlice.js";

registerApiAuthHandler(() => {
  store.dispatch(signOutSuccess());
  store.dispatch(clearFavorites());
});

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
