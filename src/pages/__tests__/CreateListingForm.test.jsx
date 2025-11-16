import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import CreateListingForm from "../CreateListingForm.jsx";

const originalFetch = global.fetch;

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({ user: { currentUser: { _id: "test-user" } } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

vi.mock("../../firebase.js", () => ({
  app: {},
}));

const uploadCallbacks = { current: {} };

vi.mock("firebase/storage", () => {
  const mocks = {
    getStorage: vi.fn(() => ({})),
    ref: vi.fn(() => ({})),
    uploadBytesResumable: vi.fn(() => ({
      snapshot: { ref: {} },
      on: (event, progress, error, complete) => {
        uploadCallbacks.current = { progress, error, complete };
      },
    })),
    getDownloadURL: vi.fn(async () => "https://cdn.test/image.jpg"),
  };
  return mocks;
});

const govResponse = [{ slug: "cairo", name: "Cairo" }];
const cityResponse = { cities: [{ slug: "new-cairo", name: "New Cairo" }] };

function mockFetchImplementation() {
  global.fetch = vi.fn((url, options) => {
    if (url.includes("/locations/governorates?")) {
      return Promise.resolve({
        ok: true,
        json: async () => govResponse,
      });
    }
    if (url.includes("/cities?")) {
      return Promise.resolve({
        ok: true,
        json: async () => cityResponse,
      });
    }
    if (url.includes("/areas?")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ areas: [] }),
      });
    }
    if (url.includes("/listings/create")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ listing: { _id: "listing-1" } }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
}

function renderForm() {
  mockFetchImplementation();
  const utils = render(
    <MemoryRouter>
      <CreateListingForm />
    </MemoryRouter>
  );
  return {
    user: userEvent.setup(),
    ...utils,
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
  uploadCallbacks.current = {};
});

describe("CreateListingForm", () => {
  it("shows category-specific fields when switching categories", async () => {
    const { user } = renderForm();
    const categorySelect = await screen.findByRole("combobox", {
      name: "createListing.form.categoryLabel",
    });
    await user.selectOptions(categorySelect, "land");
    expect(
      await screen.findByText("createListing.fields.plotArea")
    ).toBeInTheDocument();
  });

  it("validates required price field before submit", async () => {
    const { user } = renderForm();
    await waitFor(() =>
      expect(screen.getByLabelText("createListing.fields.title")).toBeInTheDocument()
    );
    await user.type(
      screen.getByLabelText("createListing.fields.title"),
      "Skyline"
    );
    await user.type(
      screen.getByLabelText("createListing.fields.description"),
      "Great apartment"
    );
    await user.type(
      screen.getByPlaceholderText("+2010xxxxxxxx"),
      "+201012345678"
    );
    const submitButton = screen.getByRole("button", {
      name: "createListing.actions.submit",
    });
    await user.click(submitButton);
    expect(
      await screen.findByText("createListing.messages.fieldRequired")
    ).toBeInTheDocument();
  });

  it("uploads images via Firebase helpers", async () => {
    const { user, container } = renderForm();
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    const file = new File(["img"], "photo.png", { type: "image/png" });
    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole("button", {
      name: "createListing.actions.upload",
    });
    await user.click(uploadButton);

    await act(async () => {
      actUploadComplete();
    });

    expect(
      await screen.findByAltText("listing")
    ).toHaveAttribute("src", "https://cdn.test/image.jpg");
  });
});

function actUploadComplete() {
  if (uploadCallbacks.current.progress) {
    uploadCallbacks.current.progress({ bytesTransferred: 50, totalBytes: 100 });
  }
  if (uploadCallbacks.current.complete) {
    uploadCallbacks.current.complete();
  }
}
