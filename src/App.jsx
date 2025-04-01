import { Routes, Route } from 'react-router-dom';
import HomePage from './Components/HomePage/HomePage'
import NavBar from './Components/NavBar/NavBar'
import AllCharacters from './Components/AllCharacters/AllCharacters';
import ErrorPage from './Components/ErrorPage';
import CharacterDetail from './Components/Character/CharacterDetail';
import CharacterForm from './Components/Character/CharacterForm'
import './App.css';


function App() {
  return (
    <>
    <NavBar />
    <Routes>
    <Route path="/" element={<HomePage />}/>
    <Route path="/AllCharacters" element={<AllCharacters />}/>
    <Route path="/characters/:id" element={<CharacterDetail/>} />
    <Route path="/create" element={<CharacterForm />}/>
    <Route path="/edit/:id" element={<CharacterForm />} /> 
    <Route path="*" element={<ErrorPage />}/>
    </Routes>  
    </>
  );
}

export default App;
