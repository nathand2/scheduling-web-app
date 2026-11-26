import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequestHandler } from "../js/requestHandler";
import LogIn from "./LogIn";
import SignUp from "./SignUp";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: {
    req: jest.fn(),
    endpointRoot: "http://localhost:6500",
    appRoot: "http://localhost:3000",
  },
}));

const renderAt = (path: string, page: ReactElement) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={page} />
        <Route path="/signup" element={page} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>
  );

describe("local account access", () => {
  beforeEach(() => (RequestHandler.req as jest.Mock).mockReset());

  test("registers a local account and enters the app", async () => {
    const onLoginSuccess = jest.fn();
    (RequestHandler.req as jest.Mock).mockResolvedValue({
      status: 201,
      json: async () => ({ accessToken: "token-1", userId: 7, displayName: "alex" }),
    });

    renderAt("/signup", <SignUp onLoginSuccess={onLoginSuccess} />);
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alex" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(await screen.findByText("Home page")).toBeInTheDocument();
    expect(RequestHandler.req).toHaveBeenCalledWith("/v2/auth/register", "POST", {
      username: "alex",
      password: "correct-horse",
      displayName: "alex",
    });
    expect(onLoginSuccess).toHaveBeenCalledWith({
      accessToken: "token-1",
      userId: 7,
      displayName: "alex",
    });
  });

  test("shows a clear message for invalid login credentials", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 401 });

    renderAt("/login", <LogIn onLoginSuccess={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alex" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Invalid username or password.")
    ).toBeInTheDocument();
  });

  test("shows the missing credentials message for a bad login request", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 400 });

    renderAt("/login", <LogIn onLoginSuccess={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Please enter a username and password.")
    ).toBeInTheDocument();
  });

  test("shows a service error when signup rejects an existing username", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 409 });

    renderAt("/signup", <SignUp onLoginSuccess={jest.fn()} />);
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "alex" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct-horse" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    expect(
      await screen.findByText("Username already taken. [409]")
    ).toBeInTheDocument();
  });
});
