import { Navbar, Container, Nav } from "react-bootstrap";
import Button from "react-bootstrap/Button";

import { AiOutlineUserAdd } from "react-icons/ai";

const SessionHeader = ({ showShareModal }) => {
  return (
    <div>
      <Navbar
        collapseOnSelect
        className="py-0"
        expand="lg"
        // bg="light"
        // variant="dark"
      >
        <Container fluid>
          {/* <Navbar.Toggle aria-controls="responsive-navbar-nav" /> */}
          {/* <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#Session">Session</Nav.Link>
              <Nav.Link href="#Insights">Insights</Nav.Link>
              <Nav.Link href="#Settings">Settings</Nav.Link>
            </Nav>
          </Navbar.Collapse> */}
          <Navbar.Text className="ms-auto">
            <Button className="py-1" onClick={showShareModal} style={{ minWidth: "120px" }}>
              <AiOutlineUserAdd />
              &nbsp;Share&nbsp;
            </Button>
          </Navbar.Text>
        </Container>
      </Navbar>
    </div>
  );
};

export default SessionHeader;
