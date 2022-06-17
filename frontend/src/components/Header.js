import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';

const Header = () => {
  return (
    <div className="header-container">
      <Navbar bg="light" expand="lg">
  <Container fluid>
    <Navbar.Brand href="/">Valorant Scheduler</Navbar.Brand>
    <Navbar.Toggle aria-controls="navbarScroll" />
    <Navbar.Collapse id="navbarScroll">
      <Nav
        className="me-auto my-2 my-lg-0"
        style={{ maxHeight: '100px' }}
        navbarScroll
      >
      <Nav.Link href="#home">Home</Nav.Link>
      <Nav.Link href="#session">Sessions</Nav.Link>
      <Nav.Link href="#groups">Groups</Nav.Link>
        
      </Nav>
      <div className="d-flex">
        
      <Nav.Link variant="light" href="/login">Login</Nav.Link>
      <Nav.Link variant="light" href="/signup">Sign Up</Nav.Link>
      <NavDropdown title="Username" key='down' id='dropdown-menu-align-end'
        align='end'>
          <NavDropdown.Item href="#action3">Profile</NavDropdown.Item>
          <NavDropdown.Item href="#action4">Settings</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#logout">
            Logout
          </NavDropdown.Item>
        </NavDropdown>
      </div>
    </Navbar.Collapse>
  </Container>
</Navbar>
    </div>
  );
};

export default Header;
