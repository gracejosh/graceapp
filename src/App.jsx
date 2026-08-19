import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Ably from 'ably';
import { 
  BookOpen, Globe, User, LogOut, Shield, Menu, X, Sparkles, 
  GraduationCap, MessageSquare, Trophy, Send, Camera, Quote, ExternalLink 
} from 'lucide-react';

// ==========================================
// 1. CLIENTS & CLOUDINARY HELPER
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
export const ably = ablyApiKey ? new Ably.Realtime({ key: ablyApiKey }) : null;

export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary environment variables missing');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url;
};

// ==========================================
// 2. CONTEXT PROVIDERS (Language & Auth)
// ==========================================
const LanguageContext = createContext();
const AuthContext = createContext();

const translations = {
  en: {
    home: "Home", verses: "Bible Verses", books: "Books", courses: "Courses",
    quiz: "Quiz", chat: "Chat", profile: "Profile", admin: "Admin",
    about: "About Us", login: "Login", logout: "Logout", dailyVerseTitle: "Verse of the Day"
  },
  am: {
    home: "ቤት", verses: "የመጽሐፍ ቅዱስ ጥቅሶች", books: "መጻሕፍት", courses: "ኮርሶች",
    quiz: "ጥያቄዎች", chat: "ውይይት", profile: "መገለጫ", admin: "አስተዳደር",
    about: "ስለ እኛ", login: "ግባ", logout: "ውጣ", dailyVerseTitle: "የዕለቱ የመጽሐፍ ቅዱስ ጥቅስ"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const toggleLanguage = () => {
    const next = lang === 'en' ? 'am' : 'en';
    setLang(next);
    localStorage.setItem('lang', next);
  };
  const t = (key) => translations[lang]?.[key] || key;
  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setProfile(data);
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, fetchProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useLang = () => useContext(LanguageContext);
const useAuth = () => useContext(AuthContext);

// ==========================================
// 3. NAVBAR & FOOTER
// ==========================================
const Navbar = () => {
  const { lang, toggleLanguage, t } = useLang();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: t('home'), path: '/' },
    { name: t('verses'), path: '/verses' },
    { name: t('books'), path: '/books' },
    { name: t('courses'), path: '/courses' },
    { name: t('quiz'), path: '/quiz' },
    { name: t('chat'), path: '/chat' },
    { name: t('about'), path: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif text-xl font-bold gold-gradient-text">Grace Book</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`text-sm font-medium ${location.pathname === l.path ? 'text-amber-400' : 'text-slate-300 hover:text-white'}`}
            >
              <span className={lang === 'am' ? 'font-amharic' : ''}>{l.name}</span>
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={toggleLanguage} className="px-3 py-1 rounded bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-bold">
            {lang === 'en' ? 'አማርኛ' : 'English'}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="text-sm font-medium text-slate-200">{profile?.username || 'Profile'}</Link>
              {profile?.is_admin && <Link to="/admin" className="text-purple-400 p-1"><Shield className="w-4 h-4" /></Link>}
              <button onClick={signOut} className="text-slate-400 hover:text-rose-400"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <Link to="/login" className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm">{t('login')}</Link>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-slate-300">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-950 p-4 space-y-3 border-b border-slate-800">
          {links.map((l) => (
            <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="block text-slate-300 hover:text-amber-400">
              {l.name}
            </Link>
          ))}
          <button onClick={toggleLanguage} className="w-full text-left py-2 text-amber-400 font-bold">
            Switch Language ({lang === 'en' ? 'አማርኛ' : 'English'})
          </button>
        </div>
      )}
    </nav>
  );
};

const Footer = () => (
  <footer className="mt-20 border-t border-slate-800 py-8 bg-slate-950/60 text-slate-400 text-sm">
    <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <span className="font-serif gold-gradient-text text-lg font-bold">Grace Book</span>
      <p>Empowering faith worldwide through digital fellowship.</p>
      <div className="flex items-center gap-1">
        <span>Developed by</span>
        <a href="https://addispower.pages.dev" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-bold hover:underline inline-flex items-center gap-1">
          Addis Power <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </footer>
);

// ==========================================
// 4. VIEWS & COMPONENTS
// ==========================================
const Home = () => {
  const { t, lang } = useLang();
  return (
    <div className="space-y-12 py-8">
      <div className="glass-card p-8 sm:p-12 rounded-3xl text-center space-y-4 max-w-4xl mx-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
          <Quote className="w-3.5 h-3.5" /> {t('dailyVerseTitle')}
        </span>
        <p className={`text-2xl font-serif italic text-slate-100 ${lang === 'am' ? 'font-amharic' : ''}`}>
          "For God so loved the world, that he gave his only begotten Son..."
        </p>
        <span className="text-amber-400 font-bold uppercase text-sm block">— John 3:16</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: t('verses'), path: '/verses', desc: 'Explore daily scripture & devotionals' },
          { name: t('books'), path: '/books', desc: 'Download spiritual PDFs and literature' },
          { name: t('courses'), path: '/courses', desc: 'Watch structured video courses' },
        ].map((item) => (
          <Link key={item.path} to={item.path} className="glass-card glass-card-hover p-6 rounded-2xl space-y-2">
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <p className="text-slate-400 text-sm">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

const BibleVerses = () => {
  const [verses, setVerses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('bible_verses').select('*').then(({ data }) => data && setVerses(data));
  }, []);

  return (
    <div className="space-y-6 py-6 max-w-4xl mx-auto">
      <input
        type="text"
        placeholder="Search scripture..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
      />
      <div className="space-y-4">
        {verses.filter(v => v.verse_text.toLowerCase().includes(search.toLowerCase())).map((v) => (
          <div key={v.id} className="glass-card p-6 rounded-2xl space-y-2">
            <p className="font-serif italic text-lg text-slate-200">"{v.verse_text}"</p>
            <span className="text-amber-400 font-bold text-sm block">— {v.reference}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Books = () => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    supabase.from('books').select('*').then(({ data }) => data && setBooks(data));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
      {books.map((b) => (
        <div key={b.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white">{b.title}</h3>
            <p className="text-xs text-amber-400">{b.author}</p>
            <p className="text-sm text-slate-400 mt-2">{b.description}</p>
          </div>
          <button
            onClick={() => window.open(b.cloudinary_url, '_blank')}
            className="w-full py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm"
          >
            Download PDF
          </button>
        </div>
      ))}
    </div>
  );
};

const Courses = () => (
  <div className="py-12 text-center text-slate-400 glass-card p-8 rounded-3xl">
    <GraduationCap className="w-12 h-12 text-amber-400 mx-auto mb-2" />
    <h2 className="text-2xl font-serif text-white font-bold">Video Courses</h2>
    <p>Explore video lessons linked directly from YouTube.</p>
  </div>
);

const Quiz = () => {
  const { user, profile } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const questions = [
    {
      questionText: 'Who built the ark during the great flood?',
      answerOptions: [
        { answerText: 'Moses', isCorrect: false },
        { answerText: 'Noah', isCorrect: true },
        { answerText: 'Abraham', isCorrect: false },
        { answerText: 'David', isCorrect: false },
      ],
    },
    {
      questionText: 'Which book is the first in the New Testament?',
      answerOptions: [
        { answerText: 'Matthew', isCorrect: true },
        { answerText: 'Genesis', isCorrect: false },
        { answerText: 'Revelation', isCorrect: false },
        { answerText: 'Acts', isCorrect: false },
      ],
    },
    {
      questionText: 'How many disciples did Jesus choose?',
      answerOptions: [
        { answerText: '7', isCorrect: false },
        { answerText: '10', isCorrect: false },
        { answerText: '12', isCorrect: true },
        { answerText: '40', isCorrect: false },
      ],
    },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('quiz_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(5);
    if (data) setLeaderboard(data);
  };

  const handleAnswerClick = (isCorrect) => {
    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(nextScore);

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setShowScore(true);
      if (user) saveScore(nextScore);
    }
  };

  const saveScore = async (finalScore) => {
    await supabase.from('quiz_scores').insert([
      {
        user_id: user.id,
        username: profile?.username || user.email,
        score: finalScore,
        total_questions: questions.length,
      },
    ]);
    fetchLeaderboard();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="glass-card p-8 rounded-3xl text-center space-y-4">
        <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-2xl font-serif font-bold text-white">Bible Trivia Quiz</h2>
        
        {showScore ? (
          <div className="space-y-4">
            <p className="text-xl text-slate-200">
              You scored <span className="text-amber-400 font-bold">{score}</span> out of {questions.length}!
            </p>
            <button
              onClick={() => {
                setShowScore(false);
                setCurrentQuestion(0);
                setScore(0);
              }}
              className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <p className="text-sm text-amber-400 font-semibold">Question {currentQuestion + 1} of {questions.length}</p>
            <p className="text-lg text-white font-medium">{questions[currentQuestion].questionText}</p>
            <div className="grid grid-cols-1 gap-3">
              {questions[currentQuestion].answerOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswerClick(option.isCorrect)}
                  className="w-full py-3 px-4 text-left bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500 text-slate-200 transition"
                >
                  {option.answerText}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard
        </h3>
        <div className="space-y-2">
          {leaderboard.map((item, index) => (
            <div key={item.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-300 font-medium">#{index + 1} {item.username}</span>
              <span className="text-amber-400 font-bold">{item.score}/{item.total_questions}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Chat = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setMessages(data);
        }
      } catch (err) {
        console.error("Error loading chat messages:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    if (!ably) return;

    try {
      const channel = ably.channels.get('chat:global');

      channel.subscribe('message', (msg) => {
        setMessages((prev) => [...prev, msg.data]);
      });

      const username = profile?.username || user?.email || 'Guest';
      channel.presence.enter({ username });

      channel.presence.get((err, members) => {
        if (!err && members) setOnlineUsers(members.length);
      });

      channel.presence.subscribe('enter', () => {
        channel.presence.get((err, members) => {
          if (!err && members) setOnlineUsers(members.length);
        });
      });

      channel.presence.subscribe('leave', () => {
        channel.presence.get((err, members) => {
          if (!err && members) setOnlineUsers(members.length);
        });
      });

      return () => {
        channel.presence.leave();
        channel.unsubscribe();
      };
    } catch (e) {
      console.warn("Ably realtime connection issue:", e);
    }
  }, [profile, user]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;

    const newMessage = {
      room_id: 'global',
      sender_id: user.id,
      sender_name: profile?.username || user.email,
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newMessage]);
    setText('');

    if (ably) {
      try {
        const channel = ably.channels.get('chat:global');
        await channel.publish('message', newMessage);
      } catch (e) {
        console.warn("Ably publish failed:", e);
      }
    }

    await supabase.from('messages').insert([newMessage]);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 glass-card p-6 rounded-3xl space-y-4 h-[65vh] flex flex-col justify-between">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" /> Global Fellowship Chat
        </h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
          {onlineUsers} Online
        </span>
      </div>

      <div className="overflow-y-auto space-y-3 flex-1 pr-2">
        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8">Loading fellowship messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8">No messages yet. Be the first to say welcome!</p>
        ) : (
          messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`p-3 rounded-2xl max-w-xs sm:max-w-md ${
                m.sender_id === user?.id
                  ? 'ml-auto bg-amber-500/20 border border-amber-500/30 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {m.sender_name && m.sender_id !== user?.id && (
                <p className="text-[10px] text-amber-400 font-bold mb-1">{m.sender_name}</p>
              )}
              <p className="text-sm">{m.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-800 pt-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Type a message..." : "Please log in to participate"}
          disabled={!user}
          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!user}
          className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

const Profile = () => {
  const { user, profile, fetchProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setUploading(true);
    try {
      const avatarUrl = await uploadToCloudinary(file);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile(user.id);
      alert('Avatar updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Failed to upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 glass-card p-8 rounded-3xl text-center space-y-6">
      <div className="relative w-28 h-28 mx-auto group">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Profile Avatar"
            className="w-full h-full object-cover rounded-full border-2 border-amber-500 shadow-lg"
          />
        ) : (
          <div className="w-full h-full bg-slate-800 border-2 border-amber-500 rounded-full flex items-center justify-center text-amber-400">
            <User className="w-12 h-12" />
          </div>
        )}

        <label
          htmlFor="avatar-upload"
          className="absolute inset-0 bg-slate-950/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-dashed border-amber-400"
        >
          <Camera className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-[10px] text-amber-300 font-bold">
            {uploading ? 'Uploading...' : 'Change'}
          </span>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white">{profile?.username || user?.email || 'Believer'}</h2>
        <p className="text-sm text-slate-400">{profile?.bio || 'No bio set yet.'}</p>
      </div>
    </div>
  );
};

const Admin = () => {
  const [verseText, setVerseText] = useState('');
  const [reference, setReference] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleAddVerse = async (e) => {
    e.preventDefault();
    if (!verseText || !reference) return;
    await supabase.from('bible_verses').insert([{ verse_text: verseText, reference }]);
    setVerseText('');
    setReference('');
    alert('Verse added successfully!');
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!bookTitle || !file) return;
    setUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      await supabase.from('books').insert([
        { title: bookTitle, author: bookAuthor, cloudinary_url: fileUrl },
      ]);
      setBookTitle('');
      setBookAuthor('');
      setFile(null);
      alert('Book uploaded successfully!');
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-xl font-bold text-white">Add Bible Verse</h3>
        <form onSubmit={handleAddVerse} className="space-y-3">
          <textarea
            placeholder="Verse Text"
            value={verseText}
            onChange={(e) => setVerseText(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
          />
          <input
            type="text"
            placeholder="Reference (e.g. John 3:16)"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
          />
          <button type="submit" className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Add Verse</button>
        </form>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h3 className="text-xl font-bold text-white">Upload Book (PDF)</h3>
        <form onSubmit={handleAddBook} className="space-y-3">
          <input
            type="text"
            placeholder="Book Title"
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
          />
          <input
            type="text"
            placeholder="Author"
            value={bookAuthor}
            onChange={(e) => setBookAuthor(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-slate-400"
          />
          <button type="submit" disabled={uploading} className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">
            {uploading ? 'Uploading...' : 'Upload Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    await supabase.auth.signInWithPassword({ email, password });
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto py-12 glass-card p-8 rounded-3xl space-y-4">
      <h2 className="text-2xl font-serif font-bold text-center gold-gradient-text">Sign In</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
        />
        <button type="submit" className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl">Log In</button>
      </form>
    </div>
  );
};

const About = () => (
  <div className="max-w-2xl mx-auto py-8 glass-card p-8 rounded-3xl space-y-4">
    <h2 className="text-3xl font-serif font-bold gold-gradient-text">About Grace Book</h2>
    <p className="text-slate-300">Grace Book is a commercial-grade Christian web portal designed to bring faith, scripture, and learning to modern digital spaces.</p>
  </div>
);

// ==========================================
// 5. MAIN APP COMPONENT
// ==========================================
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
            <div>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/verses" element={<BibleVerses />} />
                  <Route path="/books" element={<Books />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/about" element={<About />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
