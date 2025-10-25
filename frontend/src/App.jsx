import { Routes, Route } from 'react-router-dom'

// 🔐 Auth Components
import Login from './Components/Auth/Login'
import Register from './Components/Auth/Register'
import PrivateRoute from './Components/Auth/PrivateRoute'

// 🌐 Layout & Pages
import NavBar from './Components/NavBar/NavBar.jsx'
import HomePage from './Components/HomePage/HomePage.jsx'
import AllCharacters from './Components/AllCharacters/AllCharacters.jsx'
import MyTeam from './Components/MyTeam/MyTeam.jsx'
import ErrorPage from './Components/ErrorPage.jsx'
import CharacterDetail from './Components/Character/CharacterDetail.jsx'
import CharacterForm from './Components/Character/CharacterForm.jsx'

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/AllCharacters" element={<AllCharacters />} />
        <Route path="/characters/:id" element={<CharacterDetail />} />
        <Route path="/create" element={<CharacterForm />} />
        <Route path="/edit/:id" element={<CharacterForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protect MyTeam */}
        <Route
          path="/myteam"
          element={
            <PrivateRoute>
              <MyTeam />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </>
  )
}

export default App
