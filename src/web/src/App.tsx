import React from 'react';
import { Routes, BrowserRouter, Route } from 'react-router-dom';
import SignIn from './screens/SignIn';
import Panel from './screens/Panel';

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/signin" Component={SignIn} />
          <Route path="/" Component={Panel} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;