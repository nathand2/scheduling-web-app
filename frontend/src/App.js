import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'


import Header from './components/Header'
import LogIn from './components/LogIn'
import SignUp from './components/SignUp'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={
            <>
            Home
            </>
          } />
          <Route path="/login" element={
            <>
            <LogIn />
            </>
          } />
          <Route path="/signup" element={
            <>
            <SignUp />
            </>
          } />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
