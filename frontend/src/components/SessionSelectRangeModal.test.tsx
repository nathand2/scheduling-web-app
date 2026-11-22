import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RequestHandler } from "../js/requestHandler";
import SessionSelectRangeModal from "./SessionSelectRangeModal";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: { req: jest.fn() },
}));

const range = {
  id: 8,
  user_session_id: 5,
  user_id: 7,
  display_name: "Alex",
  status: "going",
  dt_start: new Date("2030-01-01T10:00:00.000Z"),
  dt_end: new Date("2030-01-01T12:00:00.000Z"),
};

describe("removing availability", () => {
  beforeEach(() => (RequestHandler.req as jest.Mock).mockReset());

  test("deletes the user's range and notifies the parent", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 204 });
    const handleClose = jest.fn();
    const onDeleted = jest.fn();

    render(
      <SessionSelectRangeModal
        show
        range={range}
        session={{ code: "ABC123" }}
        userId={7}
        handleClose={handleClose}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(RequestHandler.req).toHaveBeenCalledWith("/v1/sessiontimerange", "DELETE", {
      sessionTimeRangeId: 8,
      userSessionId: 5,
      sessionCode: "ABC123",
    });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test("explains when the server rejects deletion", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 403 });

    render(
      <SessionSelectRangeModal
        show
        range={range}
        session={{ code: "ABC123" }}
        userId={7}
        handleClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Unable to delete range. You did not create it")
    ).toBeInTheDocument();
  });

  test("does not offer deletion for another attendee's range", () => {
    render(
      <SessionSelectRangeModal
        show
        range={{ ...range, user_id: 99 }}
        session={{ code: "ABC123" }}
        userId={7}
        handleClose={jest.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
