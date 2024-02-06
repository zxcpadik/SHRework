import React, { useState, SetStateAction } from "react";
import { Form, Button, ButtonToolbar, ButtonGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

function SignIn() {
  const navigate = useNavigate();

  const handleClick = (url: string) => {
    navigate(url);
  };

  const [email, setEmail] = useState<string>();
  const [password, setPassword] = useState<string>();

  const onFormSubmit = (e: any) => {
    e.preventDefault();
    console.log(email);
    console.log(password);
    // we will change it later;
    handleClick("/");
  };
  return (
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
                setEmail(e.target.value);
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
          <Button variant="secondary" type="button" className="w-50 mt-3 bg-dark">
              Register
            </Button>
            <Button variant="primary" type="submit" className="w-50 mt-3">
              Auth
            </Button>
          </ButtonGroup>
        </Form>
      </div>
    </div>
  );
}

export default SignIn;
