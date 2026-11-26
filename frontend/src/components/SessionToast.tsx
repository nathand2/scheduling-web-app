import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";

interface SessionToastProps {
  title: string;
  message: string;
  show: boolean;
  setShow: (show: boolean) => void;
}

const SessionToast = ({ title, message, show, setShow }: SessionToastProps) => {
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
