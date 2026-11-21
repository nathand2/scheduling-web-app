import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequestHandler } from "../js/requestHandler";
import SessionJoin from "./SessionJoin";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: { req: jest.fn() },
}));

describe("joining a session from an invite", () => {
  beforeEach(() => {
    RequestHandler.req.mockReset();
  });

  test("joins with the invite code and opens the session", async () => {
    jest.useFakeTimers();
    RequestHandler.req.mockResolvedValue({
      status: 200,
      json: async () => ({ sessionCode: "ABC123" }),
    });

    render(
      <MemoryRouter initialEntries={["/sessionjoin?code=invite-123"]}>
        <Routes>
          <Route path="/sessionjoin" element={<SessionJoin loggedIn />} />
          <Route path="/session/:code" element={<p>Joined session</p>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Success!"))
      .toBeInTheDocument();
    expect(RequestHandler.req).toHaveBeenCalledWith("/v1/joinsession", "POST", {
      inviteCode: { inviteCode: "invite-123" },
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });
    expect(screen.getByText("Joined session")).toBeInTheDocument();
    jest.useRealTimers();
  });

  test("explains when an invite cannot be found", async () => {
    RequestHandler.req.mockResolvedValue({ status: 404 });

    render(
      <MemoryRouter initialEntries={["/sessionjoin?code=bad-invite"]}>
        <SessionJoin loggedIn />
      </MemoryRouter>
    );

    expect(await screen.findByText("Invite not found")).toBeInTheDocument();
    expect(
      screen.getByText(/may have expired or been copied incorrectly/i)
    ).toBeInTheDocument();
  });

  test("does not call the API when the invite code is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/sessionjoin"]}>
        <SessionJoin loggedIn />
      </MemoryRouter>
    );

    expect(await screen.findByText("Couldn't join the session"))
      .toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This invite link is missing its invite code."
    );
    expect(RequestHandler.req).not.toHaveBeenCalled();
  });
});
