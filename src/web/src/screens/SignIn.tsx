import React, { useState, SetStateAction } from "react";
import {
  Form,
  Button,
  ButtonToolbar,
  ButtonGroup,
  Toast,
  ToastContainer,
  Modal,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Credentials, SHReworkAPI, Ticket } from "../shrework-api";

function SignIn() {
  const navigate = useNavigate();

  const handleClick = (url: string) => {
    navigate(url);
  };

  const [username, setUsername] = useState<string>();
  const [password, setPassword] = useState<string>();

  const [id, setId] = useState<number>(1);
  const [toasts, setToasts] = useState<any[]>([]);

  const onFormSubmit = async (e: any) => {
    e.preventDefault();

    var res = await SHReworkAPI.SecureAuth(new Credentials(username, password));
    if (res.ok) {
      document.cookie = `username=${username}`;
      document.cookie = `password=${password}`;
      handleClick("/");
    } else {
      makeToast(`[AUTH] Error: ${res.status}`);
    }
  };

  const makeToast = async (msg: string) => {
    setId(id + 1);

    setToasts([...toasts, { id: id, msg }]);
  };

  const deleteToast = async (id: number) => {
    console.log(id);

    var _t = toasts;

    for (var i = 0; i < _t.length; i++) {
      if (_t[i].id == id) {
        _t.splice(i, 1);
      }
    }

    setToasts([..._t]);
  };

  return (
    <div>
      <ToastContainer
        position="bottom-center"
        className="p-3"
        style={{ zIndex: 100 }}
      >
        {toasts.map((toast: any) => (
          <Toast
            animation={true}
            style={{ backgroundColor: "var(--bs-danger)", margin: "1vh" }}
            key={toast.id}
            onClick={() => {
              deleteToast(toast.id);
            }}
            autohide={true}
          >
            <Toast.Body>{toast.msg}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
      <ButtonGroup className="d-flex">
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:01";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay A Enable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:00";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay A Disable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:11";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay B Enable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:10";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay B Disable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:21";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay C Enable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:20";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay C Disable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:31";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay D Enable
        </Button>
        <Button
          type="button"
          className="mt-3 bg-dark"
          onClick={async () => {
            var t: Ticket = new Ticket();
            t.DestinationID = 3;
            t.Data = "set:30";

            var cr = new Credentials();
            cr.password = "testpass";
            cr.username = "esptest";
            var resp = await SHReworkAPI.TicketPush(cr, t);
            console.log(resp);
          }}
        >
          Relay D Disable
        </Button>
      </ButtonGroup>
      <div
        style={{ height: "100vh" }}
        className="d-flex justify-content-center align-items-center"
      >
        <div style={{ width: 300 }}>
          <h1 className="text-center">Sign in</h1>
          <Form onSubmit={onFormSubmit}>
            <Form.Group>
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="username"
                placeholder="..."
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="..."
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
              />
            </Form.Group>
            <ButtonGroup className="d-flex">
              <Button
                variant="secondary"
                type="button"
                className="w-50 mt-3 bg-dark"
                onClick={() => {}}
              >
                Register
              </Button>
              <Button variant="primary" type="submit" className="w-50 mt-3">
                Auth
              </Button>
            </ButtonGroup>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
