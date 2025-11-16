import reducer, {
  clearFavorites,
  localToggle,
  rollbackToggle,
  hydrateFavorites,
  toggleFavorite,
} from "../favoritesSlice.js";
import API from "../../../config/api.js";

const originalFetch = global.fetch;

describe("favorites slice reducers", () => {
  it("optimistically toggles favorites via localToggle/rollbackToggle", () => {
    const state = { ids: [], lookup: {}, loading: false, error: null };
    let next = reducer(state, localToggle("foo"));
    expect(next.ids).toEqual(["foo"]);
    expect(next.lookup).toEqual({ foo: true });

    next = reducer(next, rollbackToggle("foo"));
    expect(next.ids).toEqual([]);
    expect(next.lookup).toEqual({});
  });

  it("clears favorites on clearFavorites", () => {
    const state = {
      ids: ["foo"],
      lookup: { foo: true },
      loading: false,
      error: "boom",
    };
    const next = reducer(state, clearFavorites());
    expect(next.ids).toEqual([]);
    expect(next.lookup).toEqual({});
    expect(next.error).toBeNull();
  });
});

describe("hydrateFavorites thunk", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("stores ids on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ["a", "b"],
    });
    const dispatch = vi.fn();
    const thunkResult = await hydrateFavorites()(dispatch, () => ({}), undefined);
    expect(thunkResult.payload).toEqual(["a", "b"]);
    const reducerState = reducer(undefined, {
      type: hydrateFavorites.fulfilled.type,
      payload: ["a", "b"],
    });
    expect(reducerState.lookup).toEqual({ a: true, b: true });
  });

  it("clears state when unauthorized", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => [],
    });
    const dispatch = vi.fn();
    await hydrateFavorites()(dispatch, () => ({}), undefined);
    const reducerState = reducer(
      { ids: ["a"], lookup: { a: true }, loading: true, error: null },
      {
        type: hydrateFavorites.rejected.type,
        payload: { unauthorized: true },
      }
    );
    expect(reducerState.ids).toEqual([]);
    expect(reducerState.lookup).toEqual({});
  });
});

describe("toggleFavorite thunk", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns nowFavorite flag on success", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    global.fetch = mockFetch;
    const result = await toggleFavorite({
      listingId: "foo",
      wasFavorite: false,
    })(vi.fn(), () => ({}), undefined);
    expect(result.payload).toEqual({ listingId: "foo", nowFavorite: true });
    expect(mockFetch).toHaveBeenCalledWith(`${API}/favorites/foo`, expect.anything());
  });

  it("clears favorites when API rejects with 401", () => {
    const state = {
      ids: ["foo"],
      lookup: { foo: true },
      loading: false,
      error: "old",
    };
    const reducerState = reducer(state, {
      type: toggleFavorite.rejected.type,
      payload: { unauthorized: true },
    });
    expect(reducerState.ids).toEqual([]);
    expect(reducerState.lookup).toEqual({});
    expect(reducerState.error).toBeNull();
  });

  it("propagates rejection metadata for non-401 errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    const thunk = toggleFavorite({ listingId: "foo", wasFavorite: true });
    const result = await thunk(vi.fn(), () => ({}), undefined);
    expect(result.type).toBe(toggleFavorite.rejected.type);
    expect(result.payload.listingId).toBe("foo");
  });
});
