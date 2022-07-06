import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import Button from "react-bootstrap/Button";

import {AiOutlineUserAdd} from "react-icons/ai"

const SessionHeader = () => {
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
              <Nav.Link href="#features">Do Stuff</Nav.Link>
              <Nav.Link href="#pricing">More Stuff</Nav.Link>
              <NavDropdown title="Dropdown" id="collasible-nav-dropdown">
                <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                <NavDropdown.Item href="#action/3.2">
                  Another action
                </NavDropdown.Item>
                <NavDropdown.Item href="#action/3.3">
                  Something
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#action/3.4">
                  Separated link
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
          <Button className="py-1">
            <AiOutlineUserAdd />
            &nbsp;Share&nbsp;
          </Button>
        </Container>
      </Navbar>
    </div>
  );
};

export default SessionHeader;
