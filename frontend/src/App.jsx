import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/TutorialOverlay';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Scriptorium from './pages/Scriptorium';
import Stories from './pages/Stories';
import StoryOverview from './pages/StoryOverview';
import StoryEditor from './pages/StoryEditor';
import Plots from './pages/Plots';
import TimelineView from './pages/TimelineView';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <TutorialProvider>
            <LayoutProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/scriptorium" element={<Scriptorium />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/story/:id" element={<StoryOverview />} />
                <Route path="/story/:id/edit" element={<StoryEditor />} />
                <Route path="/plots" element={<Plots />} />
                <Route path="/timeline/:id" element={<TimelineView />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/cookies" element={<CookiePolicy />} />
              </Routes>
            </LayoutProvider>
            <TutorialOverlay />
          </TutorialProvider>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
