import { Navbar, Container, Nav, NavDropdown, Button, Form, FormControl } from 'react-bootstrap';

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
      <Form className="d-flex">
      <Button variant="light">Sign In</Button>
      <NavDropdown title="Username" key='down' id='dropdown-menu-align-end'
        align='end'>
          <NavDropdown.Item href="#action3">Profile</NavDropdown.Item>
          <NavDropdown.Item href="#action4">Settings</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action5">
            Logout
          </NavDropdown.Item>
        </NavDropdown>
      </Form>
    </Navbar.Collapse>
  </Container>
</Navbar>

      {/* <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <a className="navbar-brand" href="/">
          Scheduler
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <a className="nav-link" href="/">
                Home <span className="sr-only">(current)</span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/">
                Sessions
              </a>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                id="navbarDropdown"
                href="#"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Dropdown
              </a>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                <a className="dropdown-item" href="/">
                  Action
                </a>
                <a className="dropdown-item" href="/">
                  Another action
                </a>
                <div className="dropdown-divider"></div>
                <a className="dropdown-item" href="/">
                  Something else here
                </a>
              </div>
            </li>
            <li className="nav-item">
              <a className="nav-link disabled" href="/">Disabled</a>
            </li>
          </ul>
          <form className="form-inline my-2 my-lg-0">Log in?</form>
        </div>
      </nav> */}
    </div>
  );
};

export default Header;
