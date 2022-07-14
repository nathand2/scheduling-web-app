import { useState, useEffect } from "react";

import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';


const CookieToast = () => {

  const [cookiesEnabled, setCookiesEnabled] = useState(sessionStorage.getItem('acceptCookies'))
  const [show, setShow] = useState(!sessionStorage.getItem('acceptCookies'));

  const acceptCookies = () => {
    setShow(false)
    setCookiesEnabled(false)
    sessionStorage.setItem('acceptCookies', true)
    console.log("Accepted Cookies")
  }

  return (
    <div>
      {
        !cookiesEnabled && (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="bg-dark fixed-bottom"
          >
            <ToastContainer className="p-3" position="bottom-end">
              <Toast  onClose={() => setShow(false)} show={show}>
                <Toast.Header closeButton={false}>
                  <strong className="me-auto">This site uses cookies, sorry.</strong>
                </Toast.Header>
                <Toast.Body>Cookies helps us know who you are.</Toast.Body>
                <Button onClick={acceptCookies} variant="primary" size="None" >Accept Cookies</Button>
                <br />
              </Toast>
            </ToastContainer>
          </div>
        )
      }
    </div>
  )
}

export default CookieToast