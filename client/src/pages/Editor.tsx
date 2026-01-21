import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import WorkoutForm, { WorkoutData } from '@/components/WorkoutForm';
import { Eye, Edit2, ChevronLeft } from 'lucide-react';

export default function Editor() {
  const [, setLocation] = useLocation();
  const { saveTreino, updateTreino, fetchTreinoById, loading: apiLoading } = useTreinosAPI();
  const [selectedDay, setSelectedDay] = useState<string>('Segunda-feira');
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [treinoId, setTreinoId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  // Get day and id from URL params
  useEffect(() => {
    console.log('🚀 [Editor] Componente montado');
    const params = new URLSearchParams(window.location.search);
    const dayParam = params.get('day');
    const idParam = params.get('id');

    console.log('🔍 [Editor] URL params - day:', dayParam, 'id:', idParam);

    if (idParam) {
      // Carregando treino existente do banco
      console.log(`📥 [Editor] Modo EDIÇÃO - Carregando treino ID: ${idParam}`);
      setIsEditing(true);
      setTreinoId(parseInt(idParam));
      loadTreinoFromDatabase(parseInt(idParam));
    } else if (dayParam && DAYS.includes(dayParam)) {
      // Criando novo treino
      console.log(`➕ [Editor] Modo CRIAR - Dia selecionado: ${dayParam}`);
      setSelectedDay(dayParam);
    }
  }, []);

  const loadTreinoFromDatabase = async (id: number) => {
    console.log(`📡 [Editor] Iniciando carregamento do treino ${id}...`);
    setLoadingData(true);
    try {
      const treino = await fetchTreinoById(id);
      console.log('✅ [Editor] Treino carregado:', treino);
      
      if (treino) {
        // ✅ Dados já vêm no formato correto de useTreinosAPI
        console.log('🔄 [Editor] Dados formatados:', treino);
        setWorkoutData(treino);
        setSelectedDay(treino.dayOfWeek);
      } else {
        console.error('❌ [Editor] Treino não encontrado');
        alert('Erro ao carregar treino');
        setLocation('/manager');
      }
    } catch (err) {
      console.error('❌ [Editor] Erro ao carregar treino:', err);
      alert('Erro ao carregar treino');
      setLocation('/manager');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSaveWorkout = (data: WorkoutData) => {
    console.log('💾 [Editor] handleSaveWorkout chamado com dados:', data);
    console.log('  Sections:', data.sections);
    console.log('  Total de sections:', data.sections.length);
    
    const finalData = { ...data, dayOfWeek: selectedDay };
    console.log('📝 [Editor] Dados finais para preview:', finalData);
    setWorkoutData(finalData);
    // ✅ NÃO SALVA EM LOCALSTORAGE - APENAS MOSTRA PREVIEW
    setShowPreview(true);
  };

  const handleSaveToDatabase = async () => {
    console.log('🔄 [Editor] handleSaveToDatabase chamado');
    console.log('  isEditing:', isEditing);
    console.log('  treinoId:', treinoId);
    console.log('  workoutData:', workoutData);
    console.log('  workoutData.sections:', workoutData?.sections);

    if (!workoutData) {
      console.error('❌ [Editor] workoutData é null!');
      return;
    }

    try {
      let success = false;
      
      if (isEditing && treinoId) {
        // Atualizar treino existente
        console.log(`🔄 [Editor] Atualizando treino ${treinoId}...`);
        success = await updateTreino(treinoId, workoutData);
        if (success) {
          console.log('✅ [Editor] Treino atualizado com sucesso!');
          alert('✅ Treino atualizado com sucesso!');
        }
      } else {
        // Salvar novo treino
        console.log('➕ [Editor] Salvando novo treino...');
        success = await saveTreino(workoutData);
        if (success) {
          console.log('✅ [Editor] Treino salvo com sucesso!');
          alert('✅ Treino salvo no banco de dados com sucesso!');
        }
      }
      
      if (success) {
        console.log('🔄 [Editor] Redirecionando para /manager');
        setLocation('/manager');
      } else {
        console.error('❌ [Editor] Erro ao salvar treino no banco de dados');
        alert('❌ Erro ao salvar treino no banco de dados');
      }
    } catch (err) {
      console.error('❌ [Editor] Erro:', err);
      alert('❌ Erro ao salvar treino');
    }
  };

  const handleEditAgain = () => {
    console.log('✏️ [Editor] Voltando para edição');
    setShowPreview(false);
  };

  const handleChangeDay = (newDay: string) => {
    console.log(`📅 [Editor] Mudando dia para: ${newDay}`);
    if (isEditing) {
      console.warn('⚠️ [Editor] Não é possível mudar o dia ao editar um treino existente');
      alert('Não é possível mudar o dia ao editar um treino existente');
      return;
    }
    
    setSelectedDay(newDay);
    setWorkoutData(null);
    setShowPreview(false);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#FF6B35] mb-4">⏳ Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (showPreview && workoutData) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
          <div className="container py-4 flex justify-between items-center">
            <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
              PREVIEW
            </h1>
            <div className="flex gap-4">
              <button
                onClick={handleEditAgain}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200"
              >
                <Edit2 size={18} /> EDITAR
              </button>
              <button
                onClick={() => {
                  console.log(`📺 [Editor] Exibindo na TV com day=${selectedDay}`);
                  setLocation(`/display?day=${selectedDay}`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all duration-200"
              >
                <Eye size={18} /> EXIBIR NA TV
              </button>
            </div>
          </div>
        </header>

        {/* Preview Content */}
        <main className="container py-12">
          <div className="space-y-8">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-center neon-box p-8 rounded-lg">
              <div>
                <p className="text-xs md:text-sm text-[#AAAAAA] font-mono mb-2">DATA</p>
                <p className="text-xl md:text-2xl font-bold text-[#FF6B35]">{workoutData.date}</p>
              </div>
              <div className="text-center">
                <p className="text-xs md:text-sm text-[#AAAAAA] font-mono mb-2">DIA</p>
                <p className="text-xl md:text-2xl font-bold text-[#00D9FF]">{workoutData.dayOfWeek}</p>
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-[#AAAAAA] font-mono mb-2">FOCO TÉCNICO</p>
                <p className="text-xl md:text-2xl font-bold text-[#FFD700]">{workoutData.focusTechnique}</p>
              </div>
            </div>

            {/* Sections Preview */}
            <div className="space-y-6">
              <h3 className="text-lg font-mono tracking-widest text-[#FF6B35]">SEÇÕES ({workoutData.sections?.length || 0})</h3>
              {workoutData.sections && workoutData.sections.length > 0 ? (
                workoutData.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className="neon-box p-6 md:p-8 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#FF6B35] tracking-wider mb-2">
                          {section.title}
                        </h2>
                        <p className="text-[#00D9FF] font-mono text-sm">
                          {section.durationMinutes}' minutos
                        </p>
                      </div>
                      <span className="px-4 py-2 border border-[#FF6B35] rounded text-[#FF6B35] font-mono text-sm">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {section.content && section.content.length > 0 && (
                      <ul className="space-y-2 ml-4">
                        {section.content.map((item, itemIdx) => (
                          <li
                            key={itemIdx}
                            className="text-base md:text-lg text-white/90 flex items-start gap-3"
                          >
                            <span className="text-[#FF6B35] font-bold mt-1">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[#AAAAAA]">Nenhuma seção adicionada</p>
              )}
            </div>

            {/* Save to Database Button */}
            <div className="mt-12 pt-8 border-t border-[#333333]">
              <button
                onClick={handleSaveToDatabase}
                disabled={apiLoading}
                className="w-full px-6 py-4 bg-[#00D9FF] hover:bg-[#00D9FF]/80 disabled:bg-[#00D9FF]/50 text-black font-bold text-lg rounded transition-all duration-200"
              >
                {apiLoading ? '⏳ SALVANDO...' : isEditing ? '💾 ATUALIZAR' : '💾 SALVAR E EXIBIR NA TV'}
              </button>
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
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                console.log('🔙 [Editor] Voltando para /manager');
                setLocation('/manager');
              }}
              className="flex items-center gap-2 px-3 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
            >
              <ChevronLeft size={16} /> VOLTAR
            </button>
          </div>
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
            {isEditing ? 'EDITAR TREINO' : 'CRIAR TREINO'}
          </h1>
          <p className="text-[#AAAAAA] text-sm mt-2">
            {isEditing ? 'Atualize os dados do treino' : 'Preencha os dados abaixo para criar um novo treino'}
          </p>
        </div>
      </header>

      {/* Day Selector - Apenas se não estiver editando */}
      {!isEditing && (
        <div className="container py-6 border-b border-[#333333]">
          <p className="text-sm font-mono text-[#AAAAAA] mb-3">SELECIONE O DIA</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                onClick={() => handleChangeDay(day)}
                className={`px-3 py-2 rounded font-mono text-xs md:text-sm transition-all duration-200 ${
                  selectedDay === day
                    ? 'neon-box text-[#FF6B35]'
                    : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                }`}
              >
                {day.split('-')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <main className="container py-12">
        <div className="max-w-4xl">
          <WorkoutForm 
            onSave={handleSaveWorkout}
            initialData={workoutData || undefined}
          />
        </div>
      </main>
    </div>
  );
}
