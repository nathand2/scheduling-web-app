import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

const SessionToast = ({ title, message, show, setShow }) => {
  return (
    <div>
      <div aria-live="polite" aria-atomic="true" className="fixed-bottom">
        <ToastContainer className="p-0" position="bottom-center">
          <Toast
            onClose={() => setShow(false)}
            show={show}
            delay={5000}
            autohide
          >
            <Toast.Header closeButton={true}>
              <strong className="me-auto">{title}</strong>
            </Toast.Header>
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </div>
  );
};

export default SessionToast;
