import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';

const SessionCard = ({ id, code, title, desc, dt_created, status }) => {
  const navigate = useNavigate();
  const handleOnClick = useCallback(() => navigate(`/session/${code}`, {replace: false}), [navigate]);

  return (
    <Card style={{ width: '18rem' }} onClick={handleOnClick} className="hover-cursor">
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