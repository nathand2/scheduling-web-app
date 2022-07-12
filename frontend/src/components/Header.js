import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom'


const Header = ({ logOut, loggedIn }) => {
  return (
    <div className="header-container">
      <Navbar bg="light" expand="lg">
  <Container fluid>
    {/* <Link to='/' className='link-plain'> */}
      <Navbar.Brand href="/">Valorant Scheduler</Navbar.Brand>
    {/* </Link> */}
    <Navbar.Toggle aria-controls="navbarScroll" />
    <Navbar.Collapse id="navbarScroll">
      <Nav
        className="me-auto my-2 my-lg-0"
        style={{ maxHeight: '100px' }}
        navbarScroll
      >
      <Nav.Link href="/">Home</Nav.Link>
      <Nav.Link href="/sessions">Sessions</Nav.Link>
      <Nav.Link href="/groups">Groups</Nav.Link>
        
      </Nav>
      <div className="d-flex">
        { !loggedIn &&
          <>
            <Nav.Link variant="light" href="/login">Login</Nav.Link>
            <Nav.Link variant="light" href="/signup">Sign Up</Nav.Link>
          </>
          
        }

        { loggedIn &&
          <>
            <NavDropdown title="Username" key='down' id='dropdown-menu-align-end'
              align='end'>
                <NavDropdown.Item href="#action3">Profile</NavDropdown.Item>
                <NavDropdown.Item href="#action4">Settings</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={ logOut } href="/">
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            
          </>
        }
      </div>
    </Navbar.Collapse>
  </Container>
</Navbar>
    </div>
  );
};

export default Header;
