import { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, BookOpen, BrainCircuit, Users, HeartPulse, Code, ArrowLeft } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { CanvasEngine } from './components/CanvasEngine';
import { QuizPlayer } from './components/QuizPlayer';

type Message = { role: 'user' | 'model'; text: string; image?: string };
type ClubMessage = { user: string; text: string; timestamp: number };
type Club = { id: string; name: string; icon: string; messages: ClubMessage[] };
type TimetableSession = { id: string; timeString: string; title: string; location: string; isActive: boolean };
type Doubt = { id: string; subject: string; title: string; description: string; status: 'Open' | 'Resolved' | 'Draft'; timestamp: number; history: Message[] };

export default function App() {
  const [activeTab, setActiveTab] = useState<'academics' | 'peers' | 'wellness' | 'workspace'>('academics');
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('steam_theme_dark', true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [timetable, setTimetable] = useLocalStorage<{sessions: TimetableSession[]}>('steam_timetable_data', { 
    sessions: [
      { id: '1', timeString: '09:00 - 10:30 (Now)', title: 'Advanced Calculus', location: 'Room 304', isActive: true },
      { id: '2', timeString: '11:00 - 12:30', title: 'Physics II Lab', location: 'Lab B', isActive: false },
      { id: '3', timeString: '14:00 - 15:30', title: 'Data Structures', location: 'Hall 2', isActive: false }
    ] 
  });
  
  const [doubts, setDoubts] = useLocalStorage<Doubt[]>('steam_doubts_data', [
    {
      id: 'd1', subject: 'Physics', title: "Maxwell's Equations in non-vacuum?", description: 'Having trouble understanding how the displacement current term changes when we introduce a dielectric medium.', status: 'Open', timestamp: Date.now() - 7200000, history: []
    },
    {
      id: 'd2', subject: 'Calculus', title: 'Taylor Series Remainder Theorem', description: 'Solved: Professor clarified during office hours. Notes attached in thread.', status: 'Resolved', timestamp: Date.now() - 86400000, history: [{ role: 'user', text: 'Can someone explain the Lagrange remainder form?' }, { role: 'model', text: 'The Lagrange remainder for a Taylor series of $f(x)$ centered at $a$ is given by $R_n(x) = \\frac{f^{(n+1)}(c)}{(n+1)!}(x-a)^{n+1}$, where $c$ is strictly between $x$ and $a$.' }]
    }
  ]);

  const [savedWorkflows, setSavedWorkflows] = useLocalStorage<string[]>('steam_saved_workflows', []);
  const [clubs, setClubs] = useLocalStorage<Club[]>('steam_clubs_data_v2', [
    { 
      id: '1', 
      name: 'Physics 101', 
      icon: '🌌', 
      messages: [
        { user: 'System', text: 'Welcome to Physics 101!', timestamp: Date.now() - 10000000 },
        { user: 'Alex', text: 'Hey everyone! Did anyone figure out problem 3 on the kinematics set?', timestamp: Date.now() - 3600000 },
        { user: 'Sarah', text: 'Yeah, you need to break the initial velocity into x and y components first.', timestamp: Date.now() - 3500000 },
        { user: 'Alex', text: 'Oh right! V_x = V * cos(theta). Thanks!', timestamp: Date.now() - 3400000 },
        { user: 'Dr. Miller', text: "Great teamwork. Don't forget that acceleration in the x direction is 0.", timestamp: Date.now() - 3000000 }
      ] 
    },
    { 
      id: '2', 
      name: 'CS Algorithms', 
      icon: '💻', 
      messages: [
        { user: 'System', text: 'Welcome to Algorithms!', timestamp: Date.now() - 5000000 },
        { user: 'David', text: 'Is DFS always preferred over BFS for topological sorting?', timestamp: Date.now() - 2000000 }
      ] 
    },
    { 
      id: '3', 
      name: 'Calculus Study Group', 
      icon: '📐', 
      messages: [
        { user: 'System', text: 'Welcome to Calculus Study Group!', timestamp: Date.now() - 8000000 },
        { user: 'Emily', text: 'Can someone explain integration by parts again?', timestamp: Date.now() - 1000000 }
      ] 
    }
  ]);
  const [activeClubId, setActiveClubId] = useState('1');
  const [clubInput, setClubInput] = useState('');
  
  const [activeQuiz, setActiveQuiz] = useState<{ questions: any[] } | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageUpload, setImageUpload] = useState<string | null>(null);

  // AI Response Payloads
  const [sceneSteps, setSceneSteps] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [manimCode, setManimCode] = useState<string | null>(null);
  
  const [mentalHealthFeedback, setMentalHealthFeedback] = useState<string>('');
  const [isListening, setIsListening] = useState(false);

  const activeDoubt = doubts.find(d => d.id === activeDoubtId);
  const chatHistory = activeDoubt?.history || [];

  const filteredDoubts = searchQuery.trim() 
    ? doubts.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.subject.toLowerCase().includes(searchQuery.toLowerCase())) 
    : [];
  
  const filteredClubs = searchQuery.trim()
    ? clubs.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    
    recognition.start();
  };
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping, activeDoubtId]);

  const handleCreateNewDoubt = () => {
    const newDoubt: Doubt = {
      id: 'd_' + Date.now(),
      subject: 'General',
      title: 'New Study Session',
      description: 'Start asking questions to begin your session.',
      status: 'Open',
      timestamp: Date.now(),
      history: []
    };
    setDoubts([newDoubt, ...doubts]);
    setActiveDoubtId(newDoubt.id);
  };

  const updateActiveDoubtHistory = (newHistory: Message[]) => {
    setDoubts(doubts.map(d => {
      if (d.id === activeDoubtId) {
        // Automatically update title if it's the first message and still default
        let newTitle = d.title;
        if (d.title === 'New Study Session' && newHistory.length > 0) {
          newTitle = newHistory[0].text.slice(0, 30) + (newHistory[0].text.length > 30 ? '...' : '');
        }
        return { ...d, history: newHistory, title: newTitle, description: 'Active conversation thread.' };
      }
      return d;
    }));
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageUpload) || !activeDoubtId) return;
    
    const userMsg: Message = { role: 'user', text: input, image: imageUpload || undefined };
    const updatedHistory = [...chatHistory, userMsg];
    updateActiveDoubtHistory(updatedHistory);
    
    setInput('');
    setImageUpload(null);
    setIsTyping(true);

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, history: chatHistory.slice(-10), image: userMsg.image })
      });
      const data = await res.json();
      
      let aiText = '';
      if (data.reply) {
        try {
          const parsed = JSON.parse(data.reply);
          aiText = parsed.explanation;
          
          if (parsed.scene && parsed.scene.steps) {
            setSceneSteps(parsed.scene.steps);
            setCurrentTime(0); // Reset animation time
          }
          if (parsed.manimCode) {
            setManimCode(parsed.manimCode);
          }
        } catch (e) {
          aiText = data.reply; // Fallback if not valid JSON
        }
      }

      updateActiveDoubtHistory([...updatedHistory, { role: 'model', text: aiText }]);
    } catch (err) {
      console.error(err);
      updateActiveDoubtHistory([...updatedHistory, { role: 'model', text: 'Error connecting to Slip Stream AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImageUpload(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const generateNotebook = async () => {
    if (!chatHistory.length) return;
    setIsTyping(true);
    try {
      const res = await fetch('/api/notebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: chatHistory })
      });
      const data = await res.json();
      if (data.notebook) {
        setSavedWorkflows([...savedWorkflows, data.notebook]);
        setActiveTab('workspace');
        setActiveDoubtId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const generateQuiz = async (notebookText: string) => {
    setIsGeneratingQuiz(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebookText })
      });
      const data = await res.json();
      if (data.questions) {
        setActiveQuiz(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSendClubMessage = () => {
    if (!clubInput.trim()) return;
    setClubs(clubs.map(c => 
      c.id === activeClubId 
        ? { ...c, messages: [...c.messages, { user: 'You', text: clubInput, timestamp: Date.now() }] } 
        : c
    ));
    setClubInput('');
  };

  const checkMentalHealth = async () => {
    setIsAnalyzing(true);
    setMentalHealthFeedback('');
    try {
      const res = await fetch('/api/mental-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable, mood: 'Stressed' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      setMentalHealthFeedback(data.feedback);
    } catch (err) {
      console.error(err);
      setMentalHealthFeedback('Failed to fetch mental health analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={`flex h-screen bg-background text-on-surface font-body-md overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Stitch Sidebar */}
      <aside className="w-72 bg-surface-container-lowest z-50 flex flex-col py-8 shadow-[10px_0_30px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="px-8 mb-12 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQ7-0ix-FxEyjJtXp_cQsOl9rRTsYbffearQ5mkuGsapkUx2ggaceKb_O4v9lE4NurBXpsnuROKQSlUBwXle86DjsKmO-GslBYxMO8TnUbarCzItYtpO_hZAshh6dYorBNuXhEYvmSB0NxsTIJX5WDR92DasXJKleClHRj9PGeOVuk9W4u8Qc0lAl_sMW-UvxJwJPUo6cenCsu4LOIxPgdlBLh5GYCi4hj6htDa7lpdlhUDo5vy3wf-UkFgovlS5d6iu8" alt="Slip Stream Logo" className="h-10 w-auto object-contain" />
            <span className="font-headline-md tracking-tight text-primary">Slip Stream</span>
          </div>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          <button 
            onClick={() => { setActiveTab('academics'); setActiveDoubtId(null); }} 
            className={`w-full group flex items-center px-6 py-4 rounded-full transition-all duration-300 ${activeTab === 'academics' ? 'bg-primary-container text-on-primary-container shadow-md scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-95'}`}
          >
            <span className="material-symbols-outlined mr-4 text-[24px]">school</span>
            <span className="font-button-text">Academics</span>
          </button>
          <button 
            onClick={() => { setActiveTab('workspace'); setActiveDoubtId(null); }} 
            className={`w-full group flex items-center px-6 py-4 rounded-full transition-all duration-300 ${activeTab === 'workspace' ? 'bg-primary-container text-on-primary-container shadow-md scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-95'}`}
          >
            <span className="material-symbols-outlined mr-4 text-[24px]">code</span>
            <span className="font-button-text">Workspace (MD)</span>
          </button>
          <button 
            onClick={() => { setActiveTab('peers'); setActiveDoubtId(null); }} 
            className={`w-full group flex items-center px-6 py-4 rounded-full transition-all duration-300 ${activeTab === 'peers' ? 'bg-primary-container text-on-primary-container shadow-md scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-95'}`}
          >
            <span className="material-symbols-outlined mr-4 text-[24px]">groups</span>
            <span className="font-button-text">Peers</span>
          </button>
          <button 
            onClick={() => { setActiveTab('wellness'); setActiveDoubtId(null); }} 
            className={`w-full group flex items-center px-6 py-4 rounded-full transition-all duration-300 ${activeTab === 'wellness' ? 'bg-primary-container text-on-primary-container shadow-md scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface active:scale-95'}`}
          >
            <span className="material-symbols-outlined mr-4 text-[24px]">self_care</span>
            <span className="font-button-text">Mental Health</span>
          </button>
        </nav>
        <div className="px-6 mt-auto">
          <div className="p-6 rounded-2xl bg-surface-container-low flex items-center gap-4 border border-outline-variant/10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-on-primary text-[20px]">person</span>
            </div>
            <div className="overflow-hidden text-left">
              <p className="font-button-text text-on-surface truncate">Alex Chen</p>
              <p className="text-label-caps text-on-surface-variant opacity-60">Standard Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative h-full bg-background overflow-hidden">
        {/* Top Header */}
        <header className="absolute top-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl z-40 flex items-center justify-end px-16">
          <div className="flex items-center gap-6 text-on-surface-variant">
            <button 
              onClick={() => { setIsSearchOpen(!isSearchOpen); setIsNotificationsOpen(false); }} 
              className={`p-2 rounded-full transition-colors ${isSearchOpen ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[24px]">search</span>
            </button>
            <button 
              onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsSearchOpen(false); }}
              className={`p-2 rounded-full transition-colors relative ${isNotificationsOpen ? 'bg-surface-container-high text-primary' : 'hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
          </div>
        </header>

        {isSearchOpen && (
          <div className="absolute top-20 right-32 w-96 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex gap-2 items-center bg-surface p-2 rounded-full border border-outline-variant/50 focus-within:border-primary">
              <span className="material-symbols-outlined text-outline ml-2">search</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doubts, sessions, clubs..." 
                className="bg-transparent border-none outline-none flex-1 font-body-md" 
                autoFocus 
              />
            </div>
            {searchQuery.trim() ? (
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                <p className="font-label-caps text-outline ml-2">Search Results</p>
                {filteredDoubts.length === 0 && filteredClubs.length === 0 && (
                  <p className="text-sm text-outline ml-2 py-2">No results found.</p>
                )}
                {filteredDoubts.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => { setActiveTab('academics'); setActiveDoubtId(d.id); setIsSearchOpen(false); setSearchQuery(''); }}
                    className="w-full text-left p-3 hover:bg-surface-container rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <span className="material-symbols-outlined text-outline">psychology_alt</span>
                    <div className="overflow-hidden">
                      <p className="font-body-md leading-tight truncate">{d.title}</p>
                      <p className="text-xs text-outline font-label-caps uppercase mt-0.5">{d.subject} • Doubt</p>
                    </div>
                  </button>
                ))}
                {filteredClubs.map(c => (
                  <button 
                    key={c.id} 
                    onClick={() => { setActiveTab('peers'); setActiveClubId(c.id); setIsSearchOpen(false); setSearchQuery(''); }}
                    className="w-full text-left p-3 hover:bg-surface-container rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <span className="text-2xl shrink-0">{c.icon}</span>
                    <div className="overflow-hidden">
                      <p className="font-body-md leading-tight truncate">{c.name}</p>
                      <p className="text-xs text-outline font-label-caps uppercase mt-0.5">Club Hub</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="font-label-caps text-outline ml-2">Recent Searches</p>
                <button className="w-full text-left p-3 hover:bg-surface-container rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">history</span>
                  <span>Maxwell's Equations</span>
                </button>
                <button className="w-full text-left p-3 hover:bg-surface-container rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline">history</span>
                  <span>Topological Sort</span>
                </button>
              </div>
            )}
          </div>
        )}

        {isNotificationsOpen && (
          <div className="absolute top-20 right-24 w-96 bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-headline-md font-bold mb-4 ml-2">Notifications</h3>
            <div className="space-y-2">
              <div className="p-3 bg-primary-container/10 border border-primary/20 rounded-xl flex gap-3">
                <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 shadow-[0_0_8px_var(--color-primary)]"></span>
                <div>
                  <p className="font-body-md font-medium text-on-surface">Upcoming Class</p>
                  <p className="font-body-sm text-on-surface-variant">Advanced Calculus starts in 15 minutes.</p>
                </div>
              </div>
              <div className="p-3 hover:bg-surface-container rounded-xl flex gap-3 transition-colors cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-transparent mt-2 shrink-0"></span>
                <div>
                  <p className="font-body-md font-medium text-on-surface">Physics 101 Hub</p>
                  <p className="font-body-sm text-on-surface-variant">Alex mentioned you in a message.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isSettingsOpen && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in duration-300">
            <div className="bg-surface-container-low w-[500px] max-w-[90vw] rounded-[2rem] shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col animate-in zoom-in-95">
              <header className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface relative">
                <h2 className="font-headline-lg font-bold">Student Profile</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors active:scale-95">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>
              
              <div className="p-8 flex-1 overflow-y-auto">
                <div className="flex items-center gap-6 mb-8 relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl blur-xl -z-10"></div>
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-on-primary text-[48px] shadow-[0_10px_30px_rgba(110,54,210,0.3)]">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div>
                    <h3 className="font-display-sm mb-1">Alex Chen</h3>
                    <p className="text-primary font-medium flex items-center gap-2 mt-1 bg-primary/10 px-3 py-1 rounded-full w-fit">
                      <span className="material-symbols-outlined text-[18px]">school</span> B.Tech Student
                    </p>
                    <p className="text-on-surface-variant flex items-center gap-2 mt-2 ml-1">
                      <span className="material-symbols-outlined text-[18px]">location_on</span> India
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-label-caps tracking-widest text-outline uppercase mb-2 ml-2">Preferences</h4>
                  
                  <div className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-body-lg font-medium">Dark Mode</p>
                      <p className="font-body-sm text-on-surface-variant mt-1">Toggle complete black background</p>
                    </div>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-14 h-8 rounded-full transition-colors relative shadow-inner ${isDarkMode ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-on-primary transition-transform shadow-md flex items-center justify-center ${isDarkMode ? 'translate-x-6' : ''}`}>
                        <span className="material-symbols-outlined text-[14px] text-primary">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-body-lg font-medium">Notifications</p>
                      <p className="font-body-sm text-on-surface-variant mt-1">Receive alerts for classes and messages</p>
                    </div>
                    <button className="w-14 h-8 rounded-full transition-colors relative bg-primary shadow-inner">
                      <span className="absolute top-1 left-1 w-6 h-6 rounded-full bg-on-primary transition-transform translate-x-6 shadow-md flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] text-primary">notifications_active</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 pt-20 px-8 lg:px-16 pb-16 overflow-y-auto relative w-full h-full custom-scrollbar">
          {activeTab === 'academics' && !activeDoubtId && (
            <div className="max-w-6xl mx-auto flex flex-col w-full relative group animate-in fade-in zoom-in-95 duration-500">
              {/* Ambient Background Blur */}
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
              <div className="absolute top-[40%] -left-40 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:-translate-y-8"></div>
              
              <div className="flex items-end justify-between mb-16 relative z-10 pt-8">
                <div>
                  <p className="font-label-caps tracking-widest uppercase mb-4 opacity-70">Semester 2 • Week 4</p>
                  <h1 className="font-display-lg text-on-surface tracking-tighter leading-none relative inline-block group-hover:text-primary transition-colors duration-500">
                    Academic Hub
                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-electric-lime transition-all duration-500 group-hover:w-full"></span>
                  </h1>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="font-label-caps uppercase">Current Status</p>
                    <p className="font-headline-md text-primary">In Flow</p>
                  </div>
                  <button onClick={handleCreateNewDoubt} className="bg-primary text-on-primary px-8 py-4 rounded-full font-button-text hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(110,54,210,0.3)] transition-all duration-300 flex items-center gap-2 active:scale-95">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Entry
                  </button>
                </div>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-12 gap-6 relative z-10">
                {/* Left Column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  {/* Timetable Card */}
                  <div className="bg-surface-container-low rounded-3xl p-8 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-32 h-32 bg-secondary-container/30 rounded-full blur-2xl group-hover/card:scale-150 transition-transform duration-700"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <h2 className="font-headline-md">Today's Rhythm</h2>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover/card:text-primary transition-colors duration-300 text-[24px]">calendar_today</span>
                    </div>
                    <div className="space-y-6 relative z-10">
                      {timetable.sessions.length > 0 ? timetable.sessions.map((session, index) => (
                        <div key={session.id} className={`relative pl-6 before:content-[''] before:absolute before:left-[4px] before:top-2 before:w-1 before:h-1 before:rounded-full ${session.isActive ? 'before:-left-0 before:w-3 before:h-3 before:bg-primary before:shadow-[0_0_10px_rgba(110,54,210,0.5)]' : 'before:bg-outline-variant'}`}>
                          <p className={`font-label-caps uppercase mb-1 ${session.isActive ? 'text-primary' : 'text-on-surface-variant'}`}>{session.timeString}</p>
                          <p className={`font-body-lg font-medium ${session.isActive ? '' : 'opacity-60'}`}>{session.title}</p>
                          {session.location && <p className="font-body-md opacity-70">{session.location}</p>}
                        </div>
                      )) : (
                        <p className="text-outline italic">No sessions scheduled today.</p>
                      )}
                    </div>
                  </div>

                  {/* Study Hours Tracker */}
                  <div className="bg-primary text-on-primary rounded-3xl p-8 hover:shadow-[0_15px_40px_rgba(110,54,210,0.2)] hover:-translate-y-1 transition-all duration-300 group/tracker relative overflow-hidden">
                    <svg className="absolute inset-0 w-full h-full opacity-10 mix-blend-overlay pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0,100 C30,80 70,120 100,60 L100,100 Z" fill="currentColor"></path>
                    </svg>
                    <h2 className="font-headline-md mb-2 relative z-10">Study Momentum</h2>
                    <p className="font-body-md opacity-80 mb-8 relative z-10">Weekly Target: 20h</p>
                    <div className="flex items-end gap-2 mb-6 relative z-10">
                      <span className="font-display-lg leading-none">14.5</span>
                      <span className="font-body-lg opacity-80 pb-2">hrs</span>
                    </div>
                    <div className="relative h-12 bg-primary-fixed-dim/20 rounded-full overflow-hidden z-10">
                      <div className="absolute top-0 left-0 h-full bg-electric-lime w-[72%] rounded-full shadow-[0_0_15px_rgba(210,255,0,0.4)] transition-all duration-1000 ease-out group-hover/tracker:w-[75%] flex items-center justify-end pr-2">
                        <div className="w-8 h-8 bg-background/20 rounded-full animate-[spin_4s_linear_infinite] flex items-center justify-center backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[16px]">bolt</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 font-label-caps opacity-70 relative z-10">
                      <span>Mon</span>
                      <span>72% Completed</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  <div className="bg-surface-off-white rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex-1 hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] transition-shadow duration-500 relative">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="font-headline-lg mb-2">Active Doubts</h2>
                        <p className="font-body-md text-on-surface-variant">Track your unresolved questions across subjects.</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
                          <span className="material-symbols-outlined text-[20px]">filter_list</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {doubts.length > 0 ? doubts.map((doubt) => {
                        const isResolved = doubt.status === 'Resolved';
                        const isDraft = doubt.status === 'Draft';
                        
                        return (
                          <div 
                            key={doubt.id}
                            onClick={() => setActiveDoubtId(doubt.id)} 
                            className={`group/doubt p-6 rounded-2xl bg-surface hover:bg-surface-container-low border border-transparent hover:border-outline-variant/20 transition-all duration-300 cursor-pointer flex gap-6 items-start ${isResolved ? 'opacity-70 hover:opacity-100' : ''}`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover/doubt:scale-110 transition-transform duration-300 ${
                              isResolved ? 'bg-surface-container-high text-on-surface-variant' : 
                              isDraft ? 'bg-tertiary-container/20 text-tertiary' : 
                              'bg-error-container text-on-error-container'
                            }`}>
                              <span className="material-symbols-outlined">
                                {isResolved ? 'check_circle' : isDraft ? 'edit_note' : 'psychology_alt'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full font-label-caps uppercase ${
                                  isResolved ? 'bg-primary-container/20 text-primary' : 
                                  isDraft ? 'bg-surface-container text-on-surface-variant' : 
                                  'bg-secondary-container/30 text-on-secondary-container'
                                }`}>
                                  {doubt.subject}
                                </span>
                                <span className="font-label-caps text-on-surface-variant opacity-60">
                                  {new Date(doubt.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className={`font-headline-md mb-2 truncate ${isResolved ? 'line-through decoration-outline-variant/50' : isDraft ? 'text-on-surface-variant italic' : ''}`}>
                                {doubt.title}
                              </h3>
                              {isDraft ? (
                                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mt-4">
                                  <div className="w-1/3 h-full bg-tertiary rounded-full"></div>
                                </div>
                              ) : (
                                <p className="font-body-md text-on-surface-variant line-clamp-2">{doubt.description}</p>
                              )}
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-4">
                              <span className={`px-3 py-1 rounded-full font-label-caps uppercase flex items-center gap-1 ${
                                isResolved ? 'bg-surface-container text-on-surface-variant' : 
                                'border border-error text-error'
                              }`}>
                                {!isResolved && <span className="w-2 h-2 rounded-full bg-error"></span>}
                                {doubt.status}
                              </span>
                              <button className="opacity-0 group-hover/doubt:opacity-100 transition-opacity text-primary font-button-text flex items-center gap-1">
                                View Thread <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              </button>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-center text-outline italic py-8">No active doubts. Start a new study session!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academics' && activeDoubtId && (
            <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] pt-4 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500 rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30">
              <header className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveDoubtId(null)} className="p-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors text-on-surface">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="font-headline-md font-bold text-on-surface">{activeDoubt?.title}</h2>
                </div>
                <button onClick={generateNotebook} className="bg-primary text-on-primary px-4 py-2 rounded-lg font-button-text text-sm hover:brightness-110 shadow-sm">
                  Generate MD Notebook
                </button>
              </header>
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-surface-container-lowest">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col border-r border-outline-variant">
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-4">
                        <BrainCircuit className="w-16 h-16 mb-4 text-primary" />
                        <h3 className="font-headline-md mb-2">How can I help you learn today?</h3>
                        <p className="font-body-md max-w-sm">Ask a question, upload a diagram, or just speak your thoughts. Slip Stream will analyze and assist.</p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl ${msg.role === 'user' ? 'bg-primary text-on-primary rounded-tr-sm shadow-md' : 'bg-surface-container-low text-on-surface rounded-tl-sm border border-outline-variant/20'}`}>
                          {msg.image && <img src={msg.image} alt="Upload" className="max-w-xs rounded-xl mb-3 object-contain shadow-sm" />}
                          {msg.role === 'user' ? <p className="font-body-md">{msg.text}</p> : <MarkdownRenderer content={msg.text} />}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-surface-container p-5 rounded-3xl rounded-tl-sm animate-typing flex items-center gap-1 h-12">
                          <span className="inline-block w-2 h-2 bg-outline rounded-full mx-0.5"></span>
                          <span className="inline-block w-2 h-2 bg-outline rounded-full mx-0.5"></span>
                          <span className="inline-block w-2 h-2 bg-outline rounded-full mx-0.5"></span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="p-4 bg-surface border-t border-outline-variant/30">
                    {imageUpload && (
                      <div className="mb-2 relative inline-block">
                        <img src={imageUpload} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-outline shadow-sm" />
                        <button onClick={() => setImageUpload(null)} className="absolute -top-2 -right-2 bg-error text-on-error rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md">x</button>
                      </div>
                    )}
                    <div className="flex items-end gap-2 bg-surface-container-low rounded-3xl p-2 border border-outline-variant/50 focus-within:border-primary transition-colors shadow-sm">
                      <label className="p-3 text-outline hover:text-primary cursor-pointer transition-colors">
                        <ImageIcon className="w-6 h-6" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <button onClick={startListening} className={`p-3 transition-colors ${isListening ? 'text-error animate-pulse' : 'text-outline hover:text-primary'}`}>
                        <Mic className="w-6 h-6" />
                      </button>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Ask a STEAM question or upload a diagram..."
                        className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 p-3 min-h-[50px] font-body-md placeholder:text-outline/70"
                        rows={1}
                      />
                      <button onClick={handleSend} disabled={!input.trim() && !imageUpload} className="p-3 bg-primary text-on-primary rounded-full hover:brightness-110 disabled:opacity-50 transition-all shadow-md">
                        <Send className="w-5 h-5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulation Panel */}
                {(sceneSteps.length > 0 || manimCode) && (
                  <div className="w-full md:w-[400px] bg-surface-container flex flex-col overflow-y-auto">
                    <header className="p-4 bg-surface-container-low border-b border-outline-variant/30">
                      <h3 className="font-headline-md font-bold">Interactive Sandbox</h3>
                    </header>
                    
                    {sceneSteps.length > 0 && (
                      <div className="p-4 border-b border-outline-variant/30">
                        <h4 className="text-sm font-label-caps text-outline mb-3">Deterministic Animation</h4>
                        <div className="rounded-2xl overflow-hidden shadow-inner bg-inverse-surface border border-outline-variant/20">
                          <CanvasEngine steps={sceneSteps} currentTime={currentTime} />
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          <input 
                            type="range" 
                            min={0} max={Math.max(...sceneSteps.map(s => s.time))} 
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                            className="w-full accent-primary"
                          />
                          <div className="flex justify-between text-xs font-label-caps text-outline">
                            <span>0s</span>
                            <span>{Math.max(...sceneSteps.map(s => s.time))}s</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {manimCode && (
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="text-sm font-label-caps text-outline mb-3">Manim CE Export</h4>
                        <pre className="flex-1 bg-inverse-surface text-inverse-on-surface p-4 rounded-xl text-xs overflow-auto font-mono shadow-inner border border-outline-variant/20">
                          {manimCode}
                        </pre>
                        <button onClick={() => {
                          const blob = new Blob([manimCode], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'scene.py';
                          a.click();
                        }} className="mt-4 w-full py-3 bg-secondary-container text-on-secondary-container font-button-text rounded-xl hover:brightness-110 transition-all shadow-sm">
                          Download .py
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="max-w-6xl mx-auto h-full relative z-10 pt-8 animate-in fade-in duration-300">
              {activeQuiz ? (
                <div className="bg-surface p-8 rounded-3xl shadow-xl border border-outline-variant/30">
                  <QuizPlayer quiz={activeQuiz} onClose={() => setActiveQuiz(null)} />
                </div>
              ) : (
                <>
                  <h2 className="font-headline-lg font-bold mb-8">Generated Workflows</h2>
                  {savedWorkflows.length === 0 ? (
                    <div className="text-center text-outline mt-32">
                      <BookOpen className="w-20 h-20 mx-auto mb-6 opacity-40 text-primary" />
                      <p className="font-body-lg">No workflows generated yet. Ask a question in the Academic Hub and click "Generate MD Notebook".</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8">
                      {savedWorkflows.map((flow, i) => (
                        <div key={i} className="bg-surface p-10 rounded-[2rem] border border-outline-variant/30 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative group hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] transition-all duration-300">
                          <button 
                            onClick={() => generateQuiz(flow)}
                            disabled={isGeneratingQuiz}
                            className="absolute top-6 right-6 bg-tertiary-container text-on-tertiary-container px-6 py-3 rounded-full font-button-text hover:brightness-110 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 shadow-md flex items-center gap-2 z-10"
                          >
                            <span className="material-symbols-outlined text-[20px]">quiz</span>
                            {isGeneratingQuiz ? 'Generating...' : 'Test Knowledge'}
                          </button>
                          <MarkdownRenderer content={flow} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'peers' && (
            <div className="max-w-7xl mx-auto h-[calc(100vh-160px)] pt-4 flex animate-in fade-in duration-300">
              <div className="flex-1 flex overflow-hidden bg-surface rounded-3xl shadow-2xl border border-outline-variant/30">
                {/* Clubs Sidebar */}
                <div className="w-24 md:w-72 bg-surface-container flex flex-col p-6 border-r border-outline-variant/30 gap-4 overflow-y-auto custom-scrollbar">
                  <h3 className="hidden md:block font-label-caps text-outline uppercase tracking-widest mb-4">Active Hubs</h3>
                  {clubs.map((club) => (
                    <button 
                      key={club.id} 
                      onClick={() => setActiveClubId(club.id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeClubId === club.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-surface-container-high'}`}
                    >
                      <span className="text-3xl">{club.icon}</span>
                      <span className="hidden md:block font-button-text truncate text-lg">{club.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Club Chat Area */}
                <div className="flex-1 flex flex-col bg-surface-container-lowest relative">
                  <header className="p-6 border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                    <h2 className="font-headline-md font-bold flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary text-[28px]">hub</span>
                      {clubs.find(c => c.id === activeClubId)?.name}
                    </h2>
                    <div className="flex items-center gap-2 bg-electric-lime/20 px-3 py-1.5 rounded-full border border-electric-lime/30">
                      <span className="w-2.5 h-2.5 rounded-full bg-electric-lime animate-pulse shadow-[0_0_10px_#D2FF00]"></span>
                      <span className="text-xs font-label-caps text-on-surface uppercase tracking-wider">Live</span>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {clubs.find(c => c.id === activeClubId)?.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.user === 'You' ? 'justify-end' : 'justify-start'}`}>
                        {msg.user !== 'You' && (
                          <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xl shadow-inner shrink-0">
                            {msg.user[0]}
                          </div>
                        )}
                        <div className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div className="flex items-baseline gap-2 mb-1.5 px-2">
                            <span className="font-label-caps text-xs text-on-surface-variant tracking-wider">{msg.user}</span>
                            <span className="text-[10px] text-outline opacity-70">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={`p-5 rounded-3xl ${msg.user === 'You' ? 'bg-primary text-on-primary rounded-tr-sm shadow-md' : 'bg-surface-container text-on-surface rounded-tl-sm border border-outline-variant/20'}`}>
                            <p className="font-body-md text-[17px]">{msg.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-surface border-t border-outline-variant/30">
                    <div className="flex items-center gap-3 bg-surface-container-lowest rounded-full p-2 pl-6 border border-outline-variant/50 focus-within:border-primary transition-all shadow-md focus-within:shadow-lg">
                      <input
                        type="text"
                        value={clubInput}
                        onChange={(e) => setClubInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendClubMessage(); }}
                        placeholder={`Message ${clubs.find(c => c.id === activeClubId)?.name}...`}
                        className="flex-1 bg-transparent border-none outline-none font-body-md text-[17px] placeholder:text-outline/60"
                      />
                      <button onClick={handleSendClubMessage} disabled={!clubInput.trim()} className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center hover:brightness-110 disabled:opacity-50 transition-all shrink-0 shadow-sm hover:scale-105 active:scale-95">
                        <Send className="w-5 h-5 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wellness' && (
            <div className="max-w-4xl mx-auto pt-20 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(136,84,237,0.3)]">
                <span className="material-symbols-outlined text-[48px] text-primary">psychology</span>
              </div>
              <h2 className="font-display-lg text-[48px] font-bold mb-6 text-center">Mental Health Advisor</h2>
              <p className="text-outline text-center text-xl max-w-2xl mb-12">
                We analyze your timetable patterns to detect cognitive overload and suggest scientifically-backed study rhythms.
              </p>
              <button onClick={checkMentalHealth} disabled={isAnalyzing} className="bg-primary text-on-primary px-10 py-5 rounded-full font-button-text text-[16px] hover:shadow-[0_15px_40px_rgba(110,54,210,0.3)] hover:-translate-y-1 transition-all duration-300 mb-12 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    Analyzing Patterns...
                  </>
                ) : (
                  'Analyze Study Patterns'
                )}
              </button>
              {mentalHealthFeedback && (
                <div className="w-full bg-surface p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-electric-lime"></div>
                  <MarkdownRenderer content={mentalHealthFeedback} />
                </div>
              )}
            </div>
          )}

        </main>
        

      </div>
    </div>
  );
}
