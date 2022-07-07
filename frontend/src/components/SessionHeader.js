import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import Button from "react-bootstrap/Button";

import {AiOutlineUserAdd} from "react-icons/ai"

const SessionHeader = ({ showShareModal }) => {
  return (
    <div>
      <Navbar
        collapseOnSelect
        className="py-0"
        expand="lg"
        bg="dark"
        variant="dark"
      >
        <Container fluid>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse id="responsive-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#features">Session</Nav.Link>
              <Nav.Link href="#features">Insights</Nav.Link>
              <Nav.Link href="#pricing">Settings</Nav.Link>
            </Nav>
          </Navbar.Collapse>
          <Navbar.Text>
            <Button className="py-1" onClick={showShareModal}>
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
