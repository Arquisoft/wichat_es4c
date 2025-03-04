import React, { useState } from 'react';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Profile from './components/Profile';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState('');

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            WIChat
          </Typography>
          {isLoggedIn && !showProfile && (
            <Button color="inherit" onClick={() => setShowProfile(true)}>
              Ver Perfil
            </Button>
          )}
          {showProfile && (
            <Button color="inherit" onClick={() => setShowProfile(false)}>
              Volver
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
          WIChat 4c
        </Typography>

        {showProfile ? (
          <Profile username={currentUser} setShowProfile={setShowProfile} /> 
        ) : showLogin ? (
          <Login setIsLoggedIn={setIsLoggedIn} setShowProfile={setShowProfile} setCurrentUser={setCurrentUser} />
        ) : (
          <AddUser />
        )}

        {!showProfile && (
          <Typography component="div" align="center" sx={{ marginTop: 2 }}>
            {showLogin ? (
              <Link name="gotoregister" component="button" variant="body2" onClick={handleToggleView}>
                Don't have an account? Register here.
              </Link>
            ) : (
              <Link component="button" variant="body2" onClick={handleToggleView}>
                Already have an account? Login here.
              </Link>
            )}
          </Typography>
        )}
      </Container>
    </>
  );
}

export default App;
