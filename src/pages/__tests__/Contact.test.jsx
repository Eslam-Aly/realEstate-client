import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactPage from "../Contact.jsx";

const originalFetch = global.fetch;
const originalWindowFetch = typeof window !== "undefined" ? window.fetch : undefined;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

beforeEach(() => {
  const mock = vi.fn();
  global.fetch = mock;
  if (typeof window !== "undefined") {
    window.fetch = mock;
  }
});

afterEach(() => {
  global.fetch = originalFetch;
  if (typeof window !== "undefined") {
    window.fetch = originalWindowFetch;
  }
  vi.resetAllMocks();
});

function fillForm(user) {
  return Promise.all([
    user.type(screen.getByLabelText("form.name"), "John Doe"),
    user.type(screen.getByLabelText("form.email"), "john@example.com"),
    user.type(screen.getByLabelText("form.subject"), "Question"),
    user.type(screen.getByLabelText("form.message"), "Please assist me"),
  ]);
}

describe("ContactPage", () => {
  it("submits the form and shows success message", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    render(<ContactPage />);

    await fillForm(user);
    fireEvent.submit(screen.getByTestId("contact-form"));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/contact"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(await screen.findByText("form.success")).toBeInTheDocument();
    expect(screen.getByLabelText("form.name")).toHaveValue("");
  });

  it("shows error when API returns failure", async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ success: false }),
    });
    render(<ContactPage />);

    await fillForm(user);
    fireEvent.submit(screen.getByTestId("contact-form"));

    expect(await screen.findByText("form.error")).toBeInTheDocument();
  });

  it("handles network errors gracefully", async () => {
    const user = userEvent.setup();
    global.fetch.mockRejectedValueOnce(new Error("network error"));
    render(<ContactPage />);

    await fillForm(user);
    fireEvent.submit(screen.getByTestId("contact-form"));

    expect(await screen.findByText("form.error")).toBeInTheDocument();
  });
});
