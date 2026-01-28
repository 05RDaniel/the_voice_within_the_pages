import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Scriptorium from './pages/Scriptorium';
import Stories from './pages/Stories';
import StoryEditor from './pages/StoryEditor';
import Plots from './pages/Plots';
import TimelineView from './pages/TimelineView';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scriptorium" element={<Scriptorium />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/story/:id" element={<StoryEditor />} />
          <Route path="/plots" element={<Plots />} />
          <Route path="/timeline/:id" element={<TimelineView />} />
        </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
