import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { Clock, Zap, Target, Flame, Play, Pause, RotateCcw, Edit2, ChevronLeft, Menu, Lock, X } from 'lucide-react';
import { WorkoutData } from '@/components/WorkoutForm';

interface TimerState {
  isRunning: boolean;
  timeLeft: number;
  isFinished: boolean;
}

const getIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('mobility')) return <Clock size={32} />;
  if (lower.includes('warm')) return <Zap size={32} />;
  if (lower.includes('skill')) return <Target size={32} />;
  if (lower.includes('strength') || lower.includes('wod')) return <Flame size={32} />;
  return <Clock size={32} />;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ✅ CREDENCIAIS ADMIN
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin@v6',
};

export default function Display() {
  const [, setLocation] = useLocation();
  const { fetchTreinoPorDia, fetchTreinoById, loading: apiLoading } = useTreinosAPI();
  const [selectedDay, setSelectedDay] = useState<string>('Segunda-feira');
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [timerStates, setTimerStates] = useState<Record<string, TimerState>>({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ NOVO: Estados de autenticação
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  // ✅ CORRIGIDO: Carregar treino ao montar (UMA VEZ)
  useEffect(() => {
    console.log('🚀 [Display] Componente montado');
    const params = new URLSearchParams(window.location.search);
    const dayParam = params.get('day');
    const idParam = params.get('id');

    console.log('🔍 [Display] URL params - day:', dayParam, 'id:', idParam);

    const loadWorkout = async () => {
      if (idParam) {
        // ✅ CARREGANDO POR ID (NOVO TREINO)
        console.log(`📥 [Display] Carregando treino por ID: ${idParam}`);
        const apiData = await fetchTreinoById(parseInt(idParam));
        if (apiData) {
          console.log('✅ [Display] Treino carregado por ID');
          setWorkoutData(apiData);
          setSelectedDay(apiData.dayOfWeek);
        } else {
          console.error('❌ [Display] Treino não encontrado');
        }
      } else if (dayParam && DAYS.includes(dayParam)) {
        // ✅ CARREGANDO POR DIA (COMPATIBILIDADE)
        console.log(`📅 [Display] Carregando treino por dia: ${dayParam}`);
        setSelectedDay(dayParam);
        const apiData = await fetchTreinoPorDia(dayParam);
        if (apiData) {
          console.log('✅ [Display] Treino carregado por dia');
          setWorkoutData(apiData);
        } else {
          console.warn(`⚠️ [Display] Nenhum treino encontrado para ${dayParam}`);
        }
      } else {
        // Padrão: Segunda-feira
        console.log('📅 [Display] Usando padrão: Segunda-feira');
        const apiData = await fetchTreinoPorDia('Segunda-feira');
        if (apiData) {
          console.log('✅ [Display] Treino carregado padrão');
          setWorkoutData(apiData);
        }
      }
    };

    loadWorkout();
  }, []);

  // Initialize timers when workout data changes
  useEffect(() => {
    console.log('🔄 [Display] Inicializando timers...');
    if (workoutData && workoutData.sections) {
      const initialStates: Record<string, TimerState> = {};
      workoutData.sections.forEach((section: any) => {
        initialStates[section.id] = {
          isRunning: false,
          timeLeft: section.durationMinutes * 60,
          isFinished: false,
        };
      });
      console.log('✅ [Display] Timers inicializados');
      setTimerStates(initialStates);
    }
  }, [workoutData]);

  // Timer interval
  useEffect(() => {
    if (Object.values(timerStates).some(state => state.isRunning)) {
      intervalRef.current = setInterval(() => {
        setTimerStates(prev => {
          const newStates = { ...prev };
          let anyRunning = false;

          Object.keys(newStates).forEach(sectionId => {
            if (newStates[sectionId].isRunning) {
              anyRunning = true;
              if (newStates[sectionId].timeLeft > 0) {
                newStates[sectionId].timeLeft -= 1;
              } else {
                newStates[sectionId].isRunning = false;
                newStates[sectionId].isFinished = true;
              }
            }
          });

          if (!anyRunning && intervalRef.current) {
            clearInterval(intervalRef.current);
          }

          return newStates;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerStates]);

  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    setScrollProgress(scrolled);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTimer = (sectionId: string) => {
    setTimerStates(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        isRunning: !prev[sectionId].isRunning,
      },
    }));
  };

  const resetTimer = (sectionId: string) => {
    if (!workoutData) return;
    const section = workoutData.sections.find(s => s.id === sectionId);
    if (section) {
      setTimerStates(prev => ({
        ...prev,
        [sectionId]: {
          isRunning: false,
          timeLeft: section.durationMinutes * 60,
          isFinished: false,
        },
      }));
    }
  };

  const getTimerProgressPercentage = (sectionId: string): number => {
    if (!workoutData) return 0;
    const section = workoutData.sections.find(s => s.id === sectionId);
    if (!section) return 0;
    const totalSeconds = section.durationMinutes * 60;
    const timeLeft = timerStates[sectionId]?.timeLeft || totalSeconds;
    return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  };

  // ✅ NOVO: Validar autenticação
  const handleLogin = () => {
    console.log('🔐 [Display] Tentando autenticação');
    
    if (authUsername === ADMIN_CREDENTIALS.username && authPassword === ADMIN_CREDENTIALS.password) {
      console.log('✅ [Display] Autenticação bem-sucedida!');
      setIsAdmin(true);
      setShowAuthModal(false);
      setAuthUsername('');
      setAuthPassword('');
      setAuthError('');
    } else {
      console.log('❌ [Display] Autenticação falhou');
      setAuthError('Usuário ou senha incorretos');
    }
  };

  // ✅ NOVO: Logout
  const handleLogout = () => {
    console.log('🚪 [Display] Saindo da autenticação');
    setIsAdmin(false);
  };

  if (apiLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#FF6B35]">⏳ Carregando treino...</h1>
          <p className="text-[#AAAAAA]">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (!workoutData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#FF6B35]">❌ Nenhum treino carregado</h1>
          <p className="text-[#AAAAAA]">Crie um treino primeiro na página de editor</p>
          <button
            onClick={() => setLocation('/manager')}
            className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all duration-200"
          >
            Ir para Gerenciador
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#FF6B35] to-[#00D9FF] z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ✅ NOVO: Botão ADMIN - Fixo no topo esquerdo */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => {
            if (isAdmin) {
              handleLogout();
            } else {
              setShowAuthModal(true);
            }
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
            isAdmin
              ? 'bg-[#FF006E] hover:bg-[#FF006E]/80 text-white'
              : 'bg-[#333333] hover:bg-[#444444] text-[#AAAAAA]'
          }`}
          title={isAdmin ? 'Sair' : 'Autenticação'}
        >
          <Lock size={14} />
          {isAdmin ? 'SAIR' : 'ADMIN'}
        </button>
      </div>

      {/* ✅ NOVO: Botão flutuante /manager - Fixo no topo direito */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setLocation('/manager')}
          className="flex items-center justify-center w-12 h-12 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Ir para Gerenciador"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Header */}
      <header className="relative border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-8 md:py-12">
          <div className="flex justify-between items-start mb-6">
            {/* ✅ NOVO: Botões protegidos por autenticação */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setLocation('/manager')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
                  title="Ir para Gerenciador"
                >
                  <Menu size={16} /> GERENCIAR
                </button>
                <button
                  onClick={() => {
                    console.log(`✏️ [Display] Editando treino do dia ${selectedDay}`);
                    setLocation(`/editor?id=${workoutData.id}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
                >
                  <Edit2 size={16} /> EDITAR
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-center">
            {/* Logo Section */}
            <div className="flex items-center justify-center md:justify-start">
              <img 
                src="/images/logo-v6.png" 
                alt="V6 CrossFit" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg"
              />
            </div>

            {/* Main Title */}
            <div className="text-center">
              <h1 className="neon-text text-4xl md:text-6xl font-bold tracking-wider mb-2">
                TREINO
              </h1>
              <p className="text-[#00D9FF] text-sm md:text-base font-mono tracking-widest">
                {workoutData.dayOfWeek.toUpperCase()} • {workoutData.date}
              </p>
            </div>

            {/* Focus */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="text-center md:text-right">
                <p className="text-[#AAAAAA] text-xs md:text-sm font-mono mb-2">FOCO TÉCNICO</p>
                <p className="text-[#FF6B35] text-2xl md:text-3xl font-bold">{workoutData.focusTechnique}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {workoutData.sections && workoutData.sections.length > 0 ? (
          <div className="space-y-8">
            {workoutData.sections.map((section, index) => {
              const timerState = timerStates[section.id] || { isRunning: false, timeLeft: 0, isFinished: false };
              const progressPercentage = getTimerProgressPercentage(section.id);

              return (
                <div
                  key={section.id}
                  className="neon-box p-8 md:p-12 rounded-lg border-2 border-[#FF6B35] hover:border-[#00D9FF] transition-all duration-300"
                >
                  {/* Section Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-start gap-4">
                      <div className="text-[#FF6B35]">{getIcon(section.title)}</div>
                      <div>
                        <p className="text-[#AAAAAA] font-mono text-xs md:text-sm mb-2">
                          SEÇÃO {index + 1} DE {workoutData.sections.length}
                        </p>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-2">
                          {section.title}
                        </h2>
                        <p className="text-[#00D9FF] font-mono text-sm md:text-base">
                          {section.durationMinutes} minutos
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="mb-8 p-6 bg-[#1a1a1a] rounded-lg border border-[#333333]">
                    <p className="text-[#AAAAAA] font-mono text-xs mb-3">CRONÔMETRO</p>
                    <div className="flex items-center justify-between mb-4">
                      <p className={`text-lg font-mono font-bold ${timerState.isRunning ? 'text-[#00D9FF]' : 'text-[#AAAAAA]'}`}>
                        {timerState.isRunning ? '▶ ATIVO' : '⏸ PAUSADO'}
                      </p>
                      <p className="text-4xl md:text-5xl font-mono font-bold text-[#FF6B35]">
                        {formatTime(timerState.timeLeft)}
                      </p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#333333] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#00D9FF] transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  {section.content && section.content.length > 0 && (
                    <div className="mb-8 p-6 bg-[#1a1a1a] rounded-lg border border-[#333333]">
                      <p className="text-[#AAAAAA] font-mono text-xs mb-4">CONTEÚDO</p>
                      <ul className="space-y-3">
                        {section.content.map((item, idx) => (
                          <li key={idx} className="text-white/80 text-sm md:text-base flex items-start gap-3">
                            <span className="text-[#FF6B35] font-bold mt-1">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => toggleTimer(section.id)}
                      className={`px-4 py-3 font-bold rounded transition-all duration-200 flex items-center justify-center gap-2 ${
                        timerState.isRunning
                          ? 'bg-[#FF006E] hover:bg-[#FF006E]/80 text-white'
                          : 'bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black'
                      }`}
                    >
                      {timerState.isRunning ? <Pause size={16} /> : <Play size={16} />}
                      {timerState.isRunning ? 'PAUSAR' : 'INICIAR'}
                    </button>
                    <button
                      onClick={() => resetTimer(section.id)}
                      className="px-4 py-3 border-2 border-[#AAAAAA] hover:border-[#FF6B35] text-[#AAAAAA] font-bold rounded transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> RESET
                    </button>
                    <div className="flex items-center justify-center px-4 py-3 bg-[#1a1a1a] rounded border border-[#333333]">
                      <p className="text-[#FF6B35] font-mono text-sm font-bold">
                        {timerState.isFinished ? '✅ CONCLUÍDO' : `${Math.round(progressPercentage)}%`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="neon-box p-12 rounded-lg text-center">
            <p className="text-[#AAAAAA] text-lg">❌ Nenhuma seção adicionada</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#333333] py-6 mt-12">
        <div className="container text-center text-[#AAAAAA] text-sm">
          <p>V6 CROSSFIT • BELO HORIZONTE</p>
          <p className="mt-2 text-xs">Treino do dia • {workoutData.dayOfWeek} • {workoutData.date}</p>
        </div>
      </footer>

      {/* ✅ NOVO: Modal de Autenticação */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="neon-box p-8 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#FF6B35] flex items-center gap-2">
                <Lock size={24} /> AUTENTICAÇÃO
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setAuthUsername('');
                  setAuthPassword('');
                }}
                className="p-2 hover:bg-[#333333] rounded transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-[#AAAAAA] font-mono text-xs mb-2">USUÁRIO</label>
              <input
                type="text"
                value={authUsername}
                onChange={(e) => {
                  setAuthUsername(e.target.value);
                  setAuthError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="admin"
                className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#333333] rounded text-white font-mono focus:border-[#FF6B35] outline-none"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-[#AAAAAA] font-mono text-xs mb-2">SENHA</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => {
                  setAuthPassword(e.target.value);
                  setAuthError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-[#1a1a1a] border-2 border-[#333333] rounded text-white font-mono focus:border-[#FF6B35] outline-none"
              />
            </div>

            {/* Error Message */}
            {authError && (
              <div className="mb-6 p-3 bg-[#FF006E]/10 border border-[#FF006E] rounded text-[#FF006E] text-sm">
                {authError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setAuthUsername('');
                  setAuthPassword('');
                }}
                className="flex-1 px-4 py-3 border-2 border-[#FF6B35] hover:bg-[#FF6B35]/10 text-[#FF6B35] font-bold rounded transition-all duration-200"
              >
                CANCELAR
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black font-bold rounded transition-all duration-200"
              >
                ENTRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
