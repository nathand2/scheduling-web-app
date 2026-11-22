/// <reference types="cypress" />
import { expect } from "chai";

export {};

describe("collaborative session scheduling", () => {
  const unique = Date.now().toString();
  const owner = `e2e_owner_${unique}`.slice(0, 25);
  const attendee = `e2e_guest_${unique}`.slice(0, 25);
  const sessionTitle = `E2E session ${unique}`;
  let inviteCode;

  const signUp = (username) => {
    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder="Password"]').type("Cypress-test-password");
    cy.contains("button", "Sign Up").click();
    cy.contains(`Welcome, ${username}`, { timeout: 10000 }).should("be.visible");
  };

  const waitForSuccessfulJoin = (attempt = 1) =>
    cy.wait("@joinSession").then(({ response }) => {
      expect(response, `join response attempt ${attempt}`).to.exist;
      cy.log(`POST /v1/joinsession attempt ${attempt}: ${response.statusCode}`);

      // RequestHandler retries a 401 after refreshing the access token. Wait for
      // that retry instead of treating the initial response as the final result.
      if (response.statusCode === 401 && attempt < 3) {
        return waitForSuccessfulJoin(attempt + 1);
      }

      expect(response.statusCode).to.equal(200);
    });

  beforeEach(() => {
    cy.visit("/signup");
  });

  it("lets an owner invite someone to join and add availability", () => {
    signUp(owner);

    cy.intercept("POST", "**/v1/session").as("createSession");
    cy.contains("a", "Create a Session").click();
    cy.get('input[placeholder="Title"]').type(sessionTitle);
    cy.contains("button", "Create Session").click();
    cy.wait("@createSession").then(({ response }) => {
      expect(response.statusCode).to.equal(200);
    });
    cy.contains("h1", sessionTitle, { timeout: 15000 }).should("be.visible");

    cy.intercept("GET", "**/v1/sessioninvite*").as("findInvite");
    cy.intercept("POST", "**/v1/sessioninvite").as("createInvite");
    cy.window().then((win) => {
      if (win.navigator.clipboard?.writeText) {
        cy.stub(win.navigator.clipboard, "writeText").resolves();
      } else {
        Object.defineProperty(win.navigator, "clipboard", {
          configurable: true,
          value: { writeText: cy.stub().resolves() },
        });
      }
    });
    cy.contains("button", "Share").click();
    cy.contains("button", "Get Link").click();
    cy.wait("@findInvite").its("response.statusCode").should("equal", 404);
    cy.wait("@createInvite").then(({ response }) => {
      cy.log("POST /v1/sessioninvite response", JSON.stringify(response?.body));
      expect(response, "invite creation response").to.exist;
      expect(response.statusCode).to.equal(200);
      inviteCode = response.body.inviteCode;
      expect(inviteCode).to.be.a("string").and.not.be.empty;
    });
    cy.contains("Share link copied to clipboard!").should("be.visible");

    // The product copies its link; navigate with the returned code so this test
    // does not depend on the browser's clipboard permissions.
    cy.contains("button", "Done").click();
    cy.get("#dropdown-menu-align-end").click();
    cy.contains(".dropdown-item", "Logout").click();
    cy.visit("/signup");
    signUp(attendee);

    cy.intercept("POST", "**/v1/joinsession").as("joinSession");
    cy.intercept("POST", "**/v1/sessiontimerange").as("addAvailability");
    cy.intercept("GET", "**/v1/timeranges*").as("getAvailability");
    cy.then(() => {
      expect(inviteCode, "invite code captured from POST /v1/sessioninvite").to.be.a("string").and.not.be.empty;
      cy.visit(`/sessionjoin?code=${encodeURIComponent(inviteCode)}`);
    });
    waitForSuccessfulJoin();
    cy.contains("h1", sessionTitle, { timeout: 15000 }).should("be.visible");
    // The browser may revalidate a cached response and receive 304 instead.
    cy.wait("@getAvailability").then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 304]);
    });

    cy.contains("button", "Add availability").click();
    cy.contains(".modal-title", "Add Date Time Range").should("be.visible");
    cy.contains("button", "Submit").click();
    cy.wait("@addAvailability").its("response.statusCode").should("equal", 200);
    cy.wait("@getAvailability").then(({ response }) => {
      expect(response.body.results).to.have.length(1);
      expect(response.body.results[0].display_name).to.equal(attendee);
    });
  });
});
