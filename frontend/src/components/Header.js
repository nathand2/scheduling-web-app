import { Navbar, Container, Nav, NavDropdown, Button } from 'react-bootstrap';

const Header = () => {
  return (
    <div className="header-container">
      <Navbar bg="light" expand="lg">
  <Container fluid>
    <Navbar.Brand href="#">Valorant Scheduler</Navbar.Brand>
    <Navbar.Toggle aria-controls="navbarScroll" />
    <Navbar.Collapse id="navbarScroll">
      <Nav
        className="me-auto my-2 my-lg-0"
        style={{ maxHeight: '100px' }}
        navbarScroll
      >
      <Nav.Link href="#action1">Home</Nav.Link>
      <Nav.Link href="#action1">Sessions</Nav.Link>
      <Nav.Link href="#action1">Groups</Nav.Link>
        
      </Nav>
      <div className="d-flex">
      <Button variant="light">Sign In</Button>
      <NavDropdown title="Username" key='down' id='dropdown-menu-align-end'
        align='end'>
          <NavDropdown.Item href="#action3">Profile</NavDropdown.Item>
          <NavDropdown.Item href="#action4">Settings</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action5">
            Login
          </NavDropdown.Item>
          <NavDropdown.Item href="#action5">
            Sign Up
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
