import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import './Footer.css';

function Footer() {
  const [quote, setQuote] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

  const getFallbackQuote = useCallback((lang) => {
    const fallbackQuotes = {
      es: [
        { quote: "Toda historia empieza cuando alguien decide no callar lo que imagina.", author: null },
        { quote: "Las palabras no crean mundos: los revelan.", author: null },
        { quote: "Escribir es ordenar el caos sin destruirlo.", author: null },
      ],
      en: [
        { quote: "Every story begins the moment imagination refuses to stay silent.", author: null },
        { quote: "Words do not build worlds; they uncover them.", author: null },
        { quote: "Writing is the art of giving chaos a direction.", author: null },
      ]
    };
    const quotes = fallbackQuotes[lang] || fallbackQuotes.en;
    return quotes[Math.floor(Math.random() * quotes.length)];
  }, []);

  const fetchQuote = useCallback(async () => {
    try {
      const lang = language === 'es' ? 'es' : 'en';
      const response = await api.get(`/api/quotes/random?lang=${lang}`);
      
      if (response && !response.error) {
        return response;
      } else {
        return getFallbackQuote(language);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      return getFallbackQuote(language);
    }
  }, [language, getFallbackQuote]);

  const changeQuote = useCallback(async () => {
    // Fade out
    setIsVisible(false);
    
    // Wait for fade out animation
    setTimeout(async () => {
      const newQuote = await fetchQuote();
      setQuote(newQuote);
      setLoading(false);
      // Fade in
      setIsVisible(true);
    }, 500);
  }, [fetchQuote]);

  // Initial load
  useEffect(() => {
    const loadInitialQuote = async () => {
      const initialQuote = await fetchQuote();
      setQuote(initialQuote);
      setLoading(false);
      setIsVisible(true);
    };
    loadInitialQuote();
  }, [fetchQuote]);

  // Change quote every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      changeQuote();
    }, 10000);

    return () => clearInterval(interval);
  }, [changeQuote]);

  if (loading) {
    return (
      <footer className="app-footer">
        <div className="footer-content">
          <span className="quote-loading">...</span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="app-footer">
      <div className="footer-content">
        {quote && (
          <div className={`quote-container ${isVisible ? 'visible' : 'hidden'}`}>
            <p className="quote-text">"{quote.quote}"</p>
            {quote.author && <span className="quote-author">— {quote.author}</span>}
          </div>
        )}
      </div>
    </footer>
  );
}

export default Footer;
