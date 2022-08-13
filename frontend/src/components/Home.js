import { Link } from "react-router-dom";
import { Container } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { IoMdAddCircle } from "react-icons/io";

const Home = ({ displayName }) => {
  return (
    <div className="flex home-container" style={{ marginTop: "50px" }}>
      <div style={{ marginBottom: "50px" }}>
        <h3>Welcome, {displayName}</h3>
      </div>
      <Container className="d-flex justify-content-center flex-wrap" fluid>
        <Card
          style={{ width: "18rem", height: "10rem" }}
          bg="light"
          text="primary"
        >
          <Link to="/sessioncreate">
            <Card.Body>
              <br />
              <IoMdAddCircle className="large-icon" />
              <Card.Text className="link-plain">Create a Session</Card.Text>
            </Card.Body>
          </Link>
        </Card>
        <Card
          style={{ width: "18rem", height: "10rem" }}
          bg="light"
          text="primary"
        >
          <Link to="/sessions" className="link-plain card-link">
            <Card.Body>
              <br />
              <Card.Text className="link-plain">
                <>View Sessions</>
              </Card.Text>
            </Card.Body>
          </Link>
        </Card>
      </Container>
    </div>
  );
};

export default Home;
