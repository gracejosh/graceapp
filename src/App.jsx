import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white p-6">
        <nav className="flex justify-between items-center max-w-5xl mx-auto py-4 border-b border-amber-500/20">
          <h1 className="text-2xl font-serif font-bold gold-gradient-text">Grace Book</h1>
          <div className="space-x-4">
            <Link to="/" className="text-amber-400 font-medium">Home</Link>
            <Link to="/about" className="text-slate-300 hover:text-amber-400">About</Link>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto py-12">
          <Routes>
            <Route path="/" element={
              <div className="glass-card p-8 rounded-3xl text-center space-y-4">
                <h2 className="text-3xl font-serif font-bold gold-gradient-text">Welcome to Grace Book</h2>
                <p className="text-slate-300 max-w-xl mx-auto">Your commercial-grade Christian web application is ready for Netlify deployment.</p>
              </div>
            } />
            <Route path="/about" element={
              <div className="glass-card p-8 rounded-3xl text-center">
                <h2 className="text-2xl font-serif font-bold gold-gradient-text">About Grace Book</h2>
                <p className="text-slate-300 mt-2">Empowering global believers through scripture, courses, and fellowship.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
