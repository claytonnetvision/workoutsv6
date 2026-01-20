import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useWorkoutStorage } from '@/hooks/useWorkoutStorage';
import WorkoutForm, { WorkoutData } from '@/components/WorkoutForm';
import { Eye, Edit2, ChevronLeft } from 'lucide-react';

interface WorkoutDataWithDB extends WorkoutData {
  id?: number;
  criado_em?: string;
  atualizado_em?: string;
  sincronizado?: boolean;
}

export default function Editor() {
  const [, setLocation] = useLocation();
  const { saveWorkout, getWorkout, DAYS } = useWorkoutStorage();
  const [selectedDay, setSelectedDay] = useState<string>('Segunda-feira');
  const [workoutData, setWorkoutData] = useState<WorkoutDataWithDB | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [salvandoNoBanco, setSalvandoNoBanco] = useState(false);

  // Get day from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dayParam = params.get('day');
    if (dayParam && DAYS.includes(dayParam)) {
      setSelectedDay(dayParam);
      const saved = getWorkout(dayParam);
      if (saved) {
        setWorkoutData(saved);
      }
    }
  }, [DAYS, getWorkout]);

  const handleSaveWorkout = async (data: WorkoutDataWithDB) => {
    const finalData = { ...data, dayOfWeek: selectedDay };
    setWorkoutData(finalData);
    
    // Salvar no localStorage
    saveWorkout(selectedDay, finalData);
    
    // Salvar no PostgreSQL (localStorage como fallback)
    setSalvandoNoBanco(true);
    try {
      const treinoParaSalvar = {
        id: data.id || Date.now(),
        data: data.date || new Date().toISOString().split('T')[0],
        dia_semana: selectedDay,
        foco_tecnico: data.focusTechnique || '',
        secoes: (data.sections || []).map((section: any) => ({
          nome_secao: section.title,
          duracao_minutos: section.durationMinutes,
          conteudo: (section.content || []).join('\n'),
          ordem: section.id,
        })),
        criado_em: data.criado_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        sincronizado: false,
        deletado: false,
      };

      // Salvar no localStorage como banco de dados
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );

      const indiceExistente = treinosArmazenados.findIndex(
        (t: any) => t.id === treinoParaSalvar.id
      );

      if (indiceExistente >= 0) {
        treinosArmazenados[indiceExistente] = treinoParaSalvar;
      } else {
        treinosArmazenados.push(treinoParaSalvar);
      }

      localStorage.setItem('treinos_db', JSON.stringify(treinosArmazenados));

      // Mostrar mensagem de sucesso
      alert('✅ Treino salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('⚠️ Treino salvo localmente (erro ao sincronizar com banco)');
    } finally {
      setSalvandoNoBanco(false);
    }
    
    setShowPreview(true);
  };

  const handleEditAgain = () => {
    setShowPreview(false);
  };

  const handleChangeDay = (newDay: string) => {
    setSelectedDay(newDay);
    const saved = getWorkout(newDay);
    if (saved) {
      setWorkoutData(saved);
    } else {
      setWorkoutData(null);
    }
    setShowPreview(false);
  };

  if (showPreview && workoutData) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
          <div className="container py-4 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setLocation('/manager')}
                className="flex items-center gap-2 px-3 py-2 border border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] rounded transition-all"
              >
                <ChevronLeft size={18} /> VOLTAR
              </button>
            </div>
            <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider mb-2">
              PREVIEW DO TREINO
            </h1>
            <p className="text-[#AAAAAA] text-sm">
              {selectedDay} - {workoutData.focusTechnique}
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <button
                  onClick={handleEditAgain}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all duration-200"
                >
                  <Edit2 size={18} /> EDITAR
                </button>

                <button
                  onClick={() => setLocation(`/display?day=${selectedDay}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200"
                >
                  <Eye size={18} /> EXIBIR NA TV
                </button>

                {salvandoNoBanco && (
                  <div className="p-4 bg-[#FF6B35]/20 border border-[#FF6B35] rounded text-[#FF6B35] text-sm">
                    ⏳ Salvando...
                  </div>
                )}

                {workoutData.sincronizado && (
                  <div className="p-4 bg-[#00D9FF]/20 border border-[#00D9FF] rounded text-[#00D9FF] text-sm">
                    ✅ Sincronizado
                  </div>
                )}
              </div>
            </div>

            {/* Right: Workout Details */}
            <div className="lg:col-span-2">
              <div className="neon-box p-6 md:p-8 rounded-lg space-y-6">
                {/* Header */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-2">
                    {workoutData.focusTechnique}
                  </h2>
                  <p className="text-[#00D9FF] font-mono text-sm">
                    {workoutData.date}
                  </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                  {workoutData.sections && workoutData.sections.map((section: any) => (
                    <div key={section.id} className="border-l-4 border-[#FF6B35] pl-4 py-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-[#FF6B35]">
                          {section.title}
                        </h3>
                        <span className="text-[#00D9FF] font-mono text-lg">
                          {section.durationMinutes}'
                        </span>
                      </div>

                      {section.content && section.content.length > 0 && (
                        <ul className="space-y-2">
                          {section.content.map((item: string, idx: number) => (
                            <li
                              key={idx}
                              className="text-white/80 flex items-start gap-3 text-sm md:text-base"
                            >
                              <span className="text-[#FF6B35] font-bold">▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
        <div className="container py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/manager')}
              className="flex items-center gap-2 px-3 py-2 border border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] rounded transition-all"
            >
              <ChevronLeft size={18} /> VOLTAR
            </button>
          </div>
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider mb-2">
            CRIAR/EDITAR TREINO
          </h1>
          <p className="text-[#AAAAAA] text-sm">Preencha os dados do treino para {selectedDay}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Day Selector */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">
                SELECIONE O DIA
              </h2>

              <div className="space-y-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => handleChangeDay(day)}
                    className={`w-full p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                      selectedDay === day
                        ? 'neon-box border-[#FF6B35] bg-[#FF6B35]/10'
                        : 'border-[#333333] hover:border-[#00D9FF]'
                    }`}
                  >
                    <span className="font-mono text-sm">{day}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <WorkoutForm
              onSubmit={handleSaveWorkout}
              initialData={workoutData || undefined}
              isLoading={salvandoNoBanco}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
