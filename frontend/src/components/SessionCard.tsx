import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import type { SessionStatus } from "../types";

interface SessionCardProps {
  code: string;
  title: string;
  desc?: string;
  dt_created: string;
  status: SessionStatus;
}

const SessionCard = ({ code, title, desc, dt_created, status }: SessionCardProps) => {
  const navigate = useNavigate();
  
  /**
   * Redirects on Session card click
   */
  const handleOnClick = useCallback(
    () => navigate(`/session/${code}`, { replace: false }),
    [navigate, code]
  );

  return (
    <Card
      className="hover-cursor h-100"
      onClick={handleOnClick}
    >
      <Card.Img variant="top" />
      <Card.Body>
        <Card.Title>{title}</Card.Title>
        <Card.Text>{desc}</Card.Text>
      </Card.Body>
      <Card.Body>
        <Badge pill bg={status === "Active" ? "primary" :
                        (status === "Upcoming" ? "info" : "secondary")}>
          {status}
        </Badge>
      </Card.Body>
      <Card.Footer className="text-muted">{dt_created}</Card.Footer>
    </Card>
  );
};

export default SessionCard;
