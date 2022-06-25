import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

const SessionCard = ({ id, title, desc, dt_created, status }) => {
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Img variant="top" />
      <Card.Body>
        <Card.Title>{ title }</Card.Title>
        <Card.Text>
          { desc }
        </Card.Text>
      </Card.Body>
      <Card.Body>
        <Badge pill bg={status === 'upcoming' ? 'primary' : 'secondary'}>
          { status }
        </Badge>
      </Card.Body>
      <Card.Footer className="text-muted">{ dt_created }</Card.Footer>
    </Card>
  )
}

export default SessionCard