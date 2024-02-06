import React from "react";
import { Button } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.css'; 
import { redirect, useNavigate } from "react-router-dom";

const Panel = () => {
  const navigate = useNavigate();
  const handleClick = (url: string) => {
      navigate(url);
  }

  const onLogOut = () => {
    console.log('LogOut pressed.'); // we will change it later
    handleClick('/signin');
  }
  return (
    <div
      style={{ height: "100vh" }}
      className="d-flex justify-content-center align-items-center"
    >
      <div style={{ width: 300 }}>
        <h1 className="text-center"> Hello, user </h1>
        <Button
          variant="primary"
          type="button"
          className="w-100 mt-3 border-radius"
          onClick={onLogOut}
        >
          Log out
        </Button>
      </div>
    </div>
  );
};

export default Panel;