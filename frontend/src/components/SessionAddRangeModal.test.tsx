import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RequestHandler } from "../js/requestHandler";
import SessionAddRangeModal from "./SessionAddRangeModal";

jest.mock("../js/requestHandler", () => ({
  RequestHandler: { req: jest.fn() },
}));

jest.mock("@mui/x-date-pickers/MobileTimePicker", () => ({
  MobileTimePicker: ({ label, onChange }) => (
    <button
      type="button"
      onClick={() =>
        onChange(require("dayjs")("2030-01-01T17:00:00.000Z"))
      }
    >
      Set {label} at session end
    </button>
  ),
}));

jest.mock("@mui/x-date-pickers/MobileDateTimePicker", () => ({
  MobileDateTimePicker: () => null,
}));

describe("adding availability", () => {
  beforeEach(() => (RequestHandler.req as jest.Mock).mockReset());

  test("submits a valid range inside the session window", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 200 });
    const handleClose = jest.fn();
    const onCreated = jest.fn();
    const session = {
      id: 42,
      code: "ABC123",
      dt_start: "2030-01-01T09:00:00.000Z",
      dt_end: "2030-01-01T17:00:00.000Z",
    };

    render(
      <SessionAddRangeModal
        show
        session={session}
        initialRange={{
          start: new Date("2030-01-01T10:00:00.000Z"),
          end: new Date("2030-01-01T12:00:00.000Z"),
        }}
        handleClose={handleClose}
        onCreated={onCreated}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(handleClose).toHaveBeenCalledTimes(1));
    expect(RequestHandler.req).toHaveBeenCalledWith(
      "/v1/sessiontimerange",
      "POST",
      expect.objectContaining({
        sessionId: 42,
        sessionCode: "ABC123",
        status: "going",
      })
    );
    expect(onCreated).toHaveBeenCalledTimes(1);
  });

  test("blocks submission when the range has no duration", async () => {
    (RequestHandler.req as jest.Mock).mockResolvedValue({ status: 200 });

    render(
      <SessionAddRangeModal
        show
        session={{
          id: 42,
          code: "ABC123",
          dt_start: "2030-01-01T09:00:00.000Z",
          dt_end: "2030-01-01T17:00:00.000Z",
        }}
        handleClose={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Set Start at session end" }));

    expect(
      screen.getByText("End time must be after start time.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(RequestHandler.req).not.toHaveBeenCalled();
  });
});
