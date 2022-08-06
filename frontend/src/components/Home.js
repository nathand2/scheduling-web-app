import { Container } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { IoMdAddCircle } from "react-icons/io";


const Home = () => {
  return (
    <div className="flex home-container" style={{ marginTop: "50px" }}>
      <Container className="d-flex justify-content-center flex-wrap" fluid>
        <Card
          style={{ width: "18rem", height: "10rem" }}
          bg="light"
          text="primary"
        >
          <a href="/sessioncreate" className="link-plain card-link">
            <Card.Body>
              <br />
              <IoMdAddCircle className="large-icon" />
              <Card.Text className="link-plain">Create a Session</Card.Text>
            </Card.Body>
          </a>
        </Card>
        <Card
          style={{ width: "18rem", height: "10rem" }}
          bg="light"
          text="primary"
        >
          <a href="/sessioncreate" className="link-plain card-link">
            <Card.Body>
              <br />
              <Card.Text className="link-plain">View Sessions</Card.Text>
            </Card.Body>
          </a>
        </Card>
      </Container>
    </div>
  );
};

export default Home;
