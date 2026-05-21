import { useState, useEffect, useCallback, useRef } from 'react';
import { engine } from './engine/index.js';
import { useInView, Reveal, VideoSlot } from './components/Shared.jsx';
import Hero from './components/Hero.jsx';
import AboutSection from './components/About.jsx';
import FeaturedVideoSection from './components/Featured.jsx';
import PhilosophySection from './components/Philosophy.jsx';
import ServicesSection from './components/Services.jsx';
import AnalyzerSection from './components/Analyzer.jsx';
import DatasetSection from './components/Dataset.jsx';
import StatsSection from './components/Stats.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [trainInfo, setTrainInfo] = useState(null);

  useEffect(() => {
    const info = engine.train();
    setTrainInfo(info);
    setReady(true);
    document.documentElement.style.setProperty('--glass-blur', '4px');
    document.documentElement.style.setProperty('--accent', '#a78bfa');
  }, []);

  const scrollTo = useCallback((id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-t-violet-400 animate-spin" />
          </div>
          <p className="text-white/60 text-sm font-medium tracking-wide">
            Entrenando clasificador Naive Bayes...
          </p>
          <p className="text-white/30 text-xs mt-2">2,500 documentos · TF-IDF · Bigrams</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white" style={{ fontFamily: "var(--font-sans)" }}>
      <Hero scrollTo={scrollTo} trainInfo={trainInfo} />
      <AboutSection />
      <FeaturedVideoSection />
      <PhilosophySection />
      <ServicesSection />

      <div id="clasificador">
        <AnalyzerSection />
      </div>

      <div id="dataset">
        <DatasetSection />
      </div>

      <div id="estadisticas">
        <StatsSection />
      </div>

      <Footer scrollTo={scrollTo} />
    </div>
  );
}
