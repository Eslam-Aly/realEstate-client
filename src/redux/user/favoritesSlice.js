import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * Pulls the persisted favourite listing ids from the backend when the app boots.
 * Returns an array of listing ids on success or flags an `unauthorized` rejection
 * so the UI can reroute anonymous visitors to the sign-in page.
 */
export const hydrateFavorites = createAsyncThunk(
  "favorites/hydrate",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/favorites/ids", { credentials: "include" });

      if (res.status === 401) {
        return rejectWithValue({ unauthorized: true });
      }

      if (!res.ok) {
        throw new Error("Failed to load favorites");
      }

      const ids = await res.json();
      return Array.isArray(ids) ? ids : [];
    } catch (error) {
      return rejectWithValue({
        message: error.message || "Failed to load favorites",
      });
    }
  }
);

/**
 * Persists a single favourite toggle. We pass the previous favourite state
 * (`wasFavorite`) down from the component so the thunk knows whether to send
 * a POST (add) or DELETE (remove), even though the UI already flipped state
 * optimistically.
 */
export const toggleFavorite = createAsyncThunk(
  "favorites/toggle",
  async ({ listingId, wasFavorite }, { rejectWithValue }) => {
    const snapshot = Boolean(wasFavorite);
    const method = snapshot ? "DELETE" : "POST";

    try {
      const res = await fetch(`/api/favorites/${listingId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (res.status === 401) {
        return rejectWithValue({
          listingId,
          unauthorized: true,
          wasFavorite: snapshot,
        });
      }

      if (!res.ok) {
        throw new Error("Toggle failed");
      }

      return { listingId, nowFavorite: !snapshot };
    } catch (error) {
      return rejectWithValue({
        listingId,
        error: error.message || "Toggle failed",
        wasFavorite: snapshot,
      });
    }
  }
);

/**
 * We keep the ids both as an array (for ordered iteration) and a lookup object
 * (O(1) existence checks for the heart icon).
 */
const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    ids: [],
    lookup: {},
    loading: false,
    error: null,
  },
  reducers: {
    /**
     * Clears favourites when users sign out or we receive an auth failure.
     */
    clearFavorites(state) {
      state.ids = [];
      state.lookup = {};
      state.error = null;
    },
    /**
     * Optimistic toggle fired before the network request completes.
     */
    localToggle(state, action) {
      const id = action.payload;
      if (state.lookup[id]) {
        delete state.lookup[id];
        state.ids = state.ids.filter((value) => value !== id);
      } else {
        state.ids.push(id);
        state.lookup[id] = true;
      }
    },
    /**
     * Reverts the optimistic change if the API call fails.
     */
    rollbackToggle(state, action) {
      const id = action.payload;
      if (state.lookup[id]) {
        delete state.lookup[id];
        state.ids = state.ids.filter((value) => value !== id);
      } else {
        state.ids.push(id);
        state.lookup[id] = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateFavorites.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(hydrateFavorites.fulfilled, (state, action) => {
      state.loading = false;
      state.ids = action.payload;
      // Mirror the ids array into a dictionary for fast lookups.
      state.lookup = Object.fromEntries(
        state.ids.map((id) => [id, true])
      );
    });

    builder.addCase(hydrateFavorites.rejected, (state, action) => {
      state.loading = false;
      if (action.payload?.unauthorized) {
        state.ids = [];
        state.lookup = {};
        state.error = null;
      } else {
        // Surface any other transport error so the UI can display feedback.
        state.error =
          action.payload?.message || action.payload || "Failed to load favorites";
      }
    });

    builder.addCase(toggleFavorite.rejected, (state, action) => {
      if (action.payload?.unauthorized) {
        // Force the visitor back to sign-in if their token is missing/expired.
        state.ids = [];
        state.lookup = {};
        state.error = null;
      }
    });
  },
});

export const { clearFavorites, localToggle, rollbackToggle } =
  favoritesSlice.actions;
export default favoritesSlice.reducer;
