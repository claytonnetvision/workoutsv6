import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';

export default function Home() {
  const [, setLocation] = useLocation();
  const { treinos, fetchTreinos, loading } = useTreinosAPI();
  const [todayDay, setTodayDay] = useState<string>('Segunda-feira');
  const [redirecting, setRedirecting] = useState(true);

  const DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  useEffect(() => {
    console.log('🏠 [Home] Componente montado');
    
    // ✅ Detectar dia da semana atual
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Domingo, 1 = Segunda, etc
    const dayName = DAYS[dayIndex];
    
    console.log(`📅 [Home] Hoje é: ${dayName} (índice: ${dayIndex})`);
    setTodayDay(dayName);

    // ✅ Carregar treinos do banco
    console.log('📡 [Home] Carregando treinos...');
    fetchTreinos();
  }, []);

  // ✅ NOVO: Quando treinos carregam, buscar o treino do dia e redirecionar
  useEffect(() => {
    if (treinos.length > 0 && redirecting) {
      console.log(`🔍 [Home] Procurando treino para: ${todayDay}`);
      console.log(`📊 [Home] Total de treinos: ${treinos.length}`);
      
      // ✅ Buscar treino que corresponde ao dia de hoje
      const treinoDodia = treinos.find(t => {
        console.log(`  Comparando: "${t.dayOfWeek}" === "${todayDay}" ? ${t.dayOfWeek === todayDay}`);
        return t.dayOfWeek === todayDay;
      });

      if (treinoDodia) {
        console.log(`✅ [Home] Treino encontrado! ID: ${treinoDodia.id}`);
        console.log(`🔄 [Home] Redirecionando para /display?id=${treinoDodia.id}`);
        setRedirecting(false);
        setLocation(`/display?id=${treinoDodia.id}`);
      } else {
        console.warn(`⚠️ [Home] Nenhum treino encontrado para ${todayDay}`);
        console.log(`📋 [Home] Treinos disponíveis:`);
        treinos.forEach((t, idx) => {
          console.log(`  [${idx}] ${t.dayOfWeek} (ID: ${t.id})`);
        });
        
        // ✅ Se não encontrar treino do dia, redirecionar para /manager
        console.log('🔄 [Home] Redirecionando para /manager (nenhum treino do dia)');
        setRedirecting(false);
        setLocation('/manager');
      }
    }
  }, [treinos, redirecting, todayDay]);

  if (redirecting || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/images/logo-v6.png" 
              alt="V6 CrossFit" 
              className="w-32 h-32 md:w-48 md:h-48 mx-auto rounded-full shadow-2xl neon-box"
            />
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            <h1 className="neon-text text-4xl md:text-5xl font-bold tracking-wider">
              V6 CROSSFIT
            </h1>
            <p className="text-[#00D9FF] font-mono text-sm md:text-base tracking-widest">
              BELO HORIZONTE
            </p>
            
            <div className="mt-8 space-y-2">
              <p className="text-[#AAAAAA] text-sm">Carregando treino de hoje...</p>
              <p className="text-[#FF6B35] font-bold text-lg">{todayDay}</p>
              
              {/* Loading Spinner */}
              <div className="flex justify-center mt-6">
                <div className="w-12 h-12 border-4 border-[#333333] border-t-[#FF6B35] rounded-full animate-spin"></div>
              </div>
            </div>

            {/* Debug Info */}
            <div className="mt-8 text-xs text-[#666666] font-mono">
              <p>Status: {loading ? 'Carregando...' : 'Pronto'}</p>
              <p>Treinos: {treinos.length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null; // Redireciona automaticamente
}
