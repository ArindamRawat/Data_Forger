import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import LandingPage from './Pages/Landing/LandingPage';
import Login from './Pages/Login/Login';
import SignUp from './Pages/Signup/SignUp';
import Main from './Pages/main/Main';
import Files from './Pages/Files/Files';

function App() {
  return (
    <>
    <Router>
    <Routes>
    
          <Route exact path='/' element={<LandingPage/>}/>
          <Route exact path='login' element={<Login/>}/>
          <Route exact path='signup' element={<SignUp/>}/>
          <Route exact path='/main' element={<Main/>}/>
          <Route exact path='/files' element={<Files/>}/>
        </Routes>
      
    </Router>
    </>
  )
}

export default App
