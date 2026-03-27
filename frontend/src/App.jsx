import { Routes, Route } from 'react-router-dom'

// 🔐 Auth Components
import Login from './Pages/Auth/Login'
import Register from './Pages/Auth/Register'
import PrivateRoute from './Pages/Auth/PrivateRoute'

// 🌐 Layout & Pages
import NavBar from './Components/NavBar/NavBar.jsx'
import HomePage from './Pages/HomePage/HomePage.jsx'
import AllCharacters from './Pages/AllCharacters/AllCharacters.jsx'
import MyTeam from './Pages/MyTeam/MyTeam.jsx'
import ErrorPage from './Pages/ErrorPage.jsx'
import CharacterDetail from './Pages/Character/CharacterDetail.jsx'
import CharacterForm from './Pages/Character/CharacterForm.jsx'

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
