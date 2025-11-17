import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { setupServer } from "msw/node";
import { http, HttpResponse, delay } from "msw";
import Search from "../../../src/pages/Search.jsx";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue ?? key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../../src/components/ListingItems.jsx", () => ({
  default: ({ listing }) => (
    <div data-testid="listing-card">{listing.title}</div>
  ),
}));

const API = import.meta.env.VITE_API_BASE;

const mockGovernorates = [
  { slug: "cairo", name: "Cairo", nameAr: "القاهرة" },
  { slug: "giza", name: "Giza", nameAr: "الجيزة" },
];

const mockCities = {
  cairo: [
    { slug: "new-cairo", name: "New Cairo", nameAr: "القاهرة الجديدة" },
  ],
};

const mockAreas = {
  "cairo:new-cairo": [
    {
      slug: "fifth-settlement",
      name: "Fifth Settlement",
      nameAr: "التجمع الخامس",
    },
  ],
};

const baseListingsHandler = http.get(`${API}/listings/get`, ({ request }) => {
  const params = new URL(request.url).searchParams;
  const term = params.get("searchTerm") || "default";
  return HttpResponse.json([
    { _id: `id-${term}`, title: `Listing ${term}` },
  ]);
});

const server = setupServer(
  http.get(`${API}/locations/governorates`, () =>
    HttpResponse.json(mockGovernorates)
  ),
  http.get(`${API}/locations/governorates/:govSlug/cities`, ({ params }) =>
    HttpResponse.json({
      cities: mockCities[params.govSlug] || [],
    })
  ),
  http.get(
    `${API}/locations/governorates/:govSlug/cities/:citySlug/areas`,
    ({ params }) =>
      HttpResponse.json({
        areas: mockAreas[`${params.govSlug}:${params.citySlug}`] || [],
      })
  ),
  baseListingsHandler
);

function renderSearch(initialEntry = "/search") {
  const router = createMemoryRouter(
    [
      {
        path: "/search",
        element: <Search />,
      },
    ],
    { initialEntries: [initialEntry] }
  );

  return {
    router,
    user: userEvent.setup(),
    ...render(<RouterProvider router={router} />),
  };
}

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Search page", () => {
  it("parses URL params and populates the initial form state", async () => {
    renderSearch(
      "/search?searchTerm=Downtown&gov=cairo&city=new-cairo&purpose=rent&category=villa&min=5000&max=15000&sort=price&order=asc"
    );

    await screen.findByText("Listing Downtown");

    expect(screen.getByLabelText("search.search")).toHaveValue("Downtown");
    expect(
      screen.getByRole("combobox", { name: "Purpose" })
    ).toHaveValue("rent");
    expect(
      screen.getByRole("combobox", { name: "Property type" })
    ).toHaveValue("villa");
    expect(screen.getByPlaceholderText("search.minPrice")).toHaveValue(5000);
    expect(screen.getByPlaceholderText("search.maxPrice")).toHaveValue(15000);
  });

  it("fetches dependent city and area lists when selections change", async () => {
    const { user } = renderSearch("/search");

    const govSelect = await screen.findByRole("combobox", {
      name: "search.governorate",
    });
    await waitFor(() => expect(govSelect.options.length).toBeGreaterThan(1));
    await user.selectOptions(govSelect, "cairo");

    const citySelect = await screen.findByRole("combobox", {
      name: "search.city",
    });
    await waitFor(() => {
      expect(citySelect).not.toBeDisabled();
      expect(citySelect.options.length).toBeGreaterThan(1);
    });
    await user.selectOptions(citySelect, "new-cairo");

    const areaSelect = await screen.findByRole("combobox", {
      name: "search.area",
    });
    await waitFor(() => expect(areaSelect.options.length).toBeGreaterThan(1));
    await user.selectOptions(areaSelect, "fifth-settlement");
    expect(areaSelect).toHaveValue("fifth-settlement");
  });

  it("ignores stale listing responses when the query changes quickly", async () => {
    server.use(
      http.get(`${API}/listings/get`, async ({ request }) => {
        const params = new URL(request.url).searchParams;
        const term = params.get("searchTerm") || "default";
        if (term === "first") {
          await delay(50);
        }
        return HttpResponse.json([{ _id: term, title: `Listing ${term}` }]);
      })
    );

    const { router } = renderSearch("/search?searchTerm=first");

    await act(async () => {
      await router.navigate("/search?searchTerm=second");
    });

    await screen.findByText("Listing second");
    expect(screen.queryByText("Listing first")).not.toBeInTheDocument();
  });
});
