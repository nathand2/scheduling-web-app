import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequestHandler } from "../js/requestHandler";
import Session from "./Session";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: {
    req: jest.fn(),
    webSocketEndpoint: "http://localhost:6500",
    webSocketPath: "/socket/v1",
    getAccessToken: jest.fn(),
  },
}));

jest.mock("socket.io-client", () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe("session access errors", () => {
  beforeEach(() => (RequestHandler.req as jest.Mock).mockReset());

  test.each([
    [401, "Please log in"],
    [403, "Not invited"],
    [404, "Session Not Found"],
  ])("shows the appropriate message for status %i", async (status, message) => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status });

    render(
      <MemoryRouter initialEntries={["/session/ABC123"]}>
        <Routes>
          <Route path="/session/:code" element={<Session userId={7} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(RequestHandler.req).toHaveBeenCalledWith("/v1/session/ABC123", "GET");
  });
});
