import React, { createContext, useState } from 'react';

export const authContext = createContext({});

const AuthProvider = ({ children }: any) => {
  const [auth, setAuth] = useState<object>({ loading: true, data: null });
// we will use loading later


  const setAuthData = (data: any) => {
    setAuth({data: data});
  };
 // a function that will help us to add the user data in the auth;

  return (
    <authContext.Provider value={{ auth, setAuthData }}>
      {children}
    </authContext.Provider>
  );
};

export default AuthProvider;