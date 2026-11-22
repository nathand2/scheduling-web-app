import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequestHandler } from "../js/requestHandler";
import SessionCreate from "./SessionCreate";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: { req: jest.fn() },
}));

describe("session creation", () => {
  beforeEach(() => {
    RequestHandler.req.mockReset();
  });

  test("submits a valid session and navigates to the created session", async () => {
    RequestHandler.req.mockResolvedValue({
      status: 200,
      json: async () => ({ code: "ABC123" }),
    });

    render(
      <MemoryRouter initialEntries={["/sessioncreate"]}>
        <Routes>
          <Route path="/sessioncreate" element={<SessionCreate />} />
          <Route path="/session/:code" element={<p>Session page opened</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Session Title"), {
      target: { value: "Board game night" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

    expect(await screen.findByText("Session page opened")).toBeInTheDocument();
    expect(RequestHandler.req).toHaveBeenCalledWith(
      "/v1/session",
      "POST",
      expect.objectContaining({
        title: "Board game night",
        attendType: "account-only",
      })
    );
  });

  test("shows an error when the API rejects session creation", async () => {
    RequestHandler.req.mockResolvedValue({ status: 500 });

    render(
      <MemoryRouter initialEntries={["/sessioncreate"]}>
        <SessionCreate />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Session Title"), {
      target: { value: "Board game night" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

    expect(
      await screen.findByText("Error: Unable to create session 500")
    ).toBeInTheDocument();
    await waitFor(() => expect(RequestHandler.req).toHaveBeenCalledTimes(1));
  });
});
