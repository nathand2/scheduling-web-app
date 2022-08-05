import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

const colAccentBlue = '#004E7C'

const Header = ({ logOut, loggedIn, displayName }) => {
  return (
    <div className="header-container">
      <Navbar
        className="py-0"
        expand="lg">
        <Container fluid>
          {/* <Link to='/' className='link-plain'> */}
          <Navbar.Brand href="/" style={{color: colAccentBlue}}>Scheduler</Navbar.Brand>
          {/* </Link> */}
          <Navbar.Toggle aria-controls="navbarScroll" />
          <Navbar.Collapse id="navbarScroll">
            <Nav
              className="me-auto my-2 my-lg-0"
              style={{ maxHeight: "100px" }}
              navbarScroll
            >
              <Nav.Link href="/">Home</Nav.Link>
              {loggedIn && (
                <>
                  <Nav.Link href="/sessions">Sessions</Nav.Link>
                  <Nav.Link href="/groups" disabled>
                    Groups
                  </Nav.Link>
                </>
              )}
              <Nav.Link href="/about">About</Nav.Link>
            </Nav>
            <div className="d-flex">
              {!loggedIn && (
                <>
                  <Nav.Link variant="light" href="/login">
                    Login
                  </Nav.Link>
                  <Nav.Link variant="light" href="/signup">
                    Sign Up
                  </Nav.Link>
                </>
              )}

              {loggedIn && (
                <>
                  <NavDropdown
                    title={displayName}
                    key="down"
                    id="dropdown-menu-align-end"
                    align="end"
                  >
                    <NavDropdown.Item href="#profile" disabled>
                      Profile
                    </NavDropdown.Item>
                    <NavDropdown.Item href="/settings">
                      Settings
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={logOut}>Logout</NavDropdown.Item>
                  </NavDropdown>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};

export default Header;
