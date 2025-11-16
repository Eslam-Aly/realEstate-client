import { render, waitFor } from "@testing-library/react";
import Favorites from "../Favorites.jsx";

const mockNavigate = vi.fn();
const state = { user: { currentUser: null } };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("react-redux", () => ({
  useSelector: (selector) => selector(state),
}));

vi.mock("../../components/ListingItems.jsx", () => ({
  default: ({ listing }) => <div data-testid="listing">{listing.title}</div>,
}));

const originalFetch = global.fetch;

afterEach(() => {
  mockNavigate.mockReset();
  state.user.currentUser = null;
  global.fetch = originalFetch;
});

describe("Favorites page routing", () => {
  it("redirects anonymous users to sign-in", () => {
    state.user.currentUser = null;
    render(<Favorites />);
    expect(mockNavigate).toHaveBeenCalledWith("/signin", { replace: true });
  });

  it("loads favorites when user exists", async () => {
    state.user.currentUser = { _id: "user-1" };
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ results: [{ _id: "1", title: "Fav" }] }),
    });
    render(<Favorites />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
