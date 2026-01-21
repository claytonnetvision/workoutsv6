import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { Trash2, Plus, Eye, Edit2 } from 'lucide-react';

interface Treino {
  id: number;
  date: string;
  dayOfWeek: string;
  focusTechnique: string;
  sections?: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    content: string[];
  }>;
}

export default function WorkoutManager() {
  const [, setLocation] = useLocation();
  const { treinos, fetchTreinos, deleteTreino, loading } = useTreinosAPI();
  const [selectedTreinoId, setSelectedTreinoId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  // Carregar treinos do banco ao montar
  useEffect(() => {
    console.log('🚀 [WorkoutManager] Componente montado, carregando treinos...');
    fetchTreinos();
  }, [fetchTreinos]);

  // Log quando treinos mudam
  useEffect(() => {
    console.log('📊 [WorkoutManager] Treinos atualizados:', treinos);
    console.log('📈 [WorkoutManager] Total de treinos:', treinos.length);
    treinos.forEach((t, idx) => {
      console.log(`  [${idx}] ID: ${t.id}, Dia: ${t.dayOfWeek}, Foco: ${t.focusTechnique}, Seções: ${t.sections?.length || 0}`);
    });
  }, [treinos]);

  // Filtrar treinos por dia
  const treinosPorDia = treinos.reduce((acc, treino) => {
    if (!acc[treino.dayOfWeek]) {
      acc[treino.dayOfWeek] = [];
    }
    acc[treino.dayOfWeek].push(treino);
    return acc;
  }, {} as Record<string, Treino[]>);

  console.log('🗂️ [WorkoutManager] Treinos por dia:', treinosPorDia);

  const selectedTreino = selectedTreinoId 
    ? treinos.find(t => t.id === selectedTreinoId)
    : null;

  console.log('👁️ [WorkoutManager] Treino selecionado:', selectedTreino);

  const handleDelete = async (id: number, dia: string) => {
    console.log(`🗑️ [WorkoutManager] Deletando treino ${id} de ${dia}`);
    if (window.confirm(`Tem certeza que deseja deletar o treino de ${dia}?`)) {
      const success = await deleteTreino(id);
      if (success) {
        alert('✅ Treino deletado com sucesso!');
        setSelectedTreinoId(null);
        console.log('🔄 [WorkoutManager] Recarregando treinos após deletar...');
        await fetchTreinos();
      } else {
        alert('❌ Erro ao deletar treino');
      }
    }
  };

  const handleEditTreino = (treinoId: number) => {
    console.log(`✏️ [WorkoutManager] Editando treino ${treinoId}`);
    setLocation(`/editor?id=${treinoId}`);
  };

  const handleCreateNewTreino = (dia: string) => {
    console.log(`➕ [WorkoutManager] Criando novo treino para ${dia}`);
    setLocation(`/editor?day=${dia}`);
  };

  const handleSelectDay = (day: string) => {
    console.log(`📅 [WorkoutManager] Selecionando dia: ${day}`);
    setSelectedDay(day);
    const treinosDodia = treinosPorDia[day] || [];
    if (treinosDodia.length > 0) {
      console.log(`  Treinos encontrados para ${day}:`, treinosDodia);
      setSelectedTreinoId(treinosDodia[0].id);
    } else {
      console.log(`  Nenhum treino para ${day}`);
      setSelectedTreinoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
        <div className="container py-4 md:py-6">
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider mb-2">
            GERENCIAR TREINOS
          </h1>
          <p className="text-[#AAAAAA] text-sm">Crie, edite e organize seus treinos da semana</p>
          {loading && <p className="text-[#00D9FF] text-xs mt-2">⏳ Carregando...</p>}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Days List */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">DIAS DA SEMANA</h2>
              
              <div className="space-y-2 mb-6">
                {DAYS.map(day => {
                  const treinosDodia = treinosPorDia[day] || [];
                  const temTreino = treinosDodia.length > 0;
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                        selectedDay === day
                          ? 'neon-box border-[#FF6B35]'
                          : temTreino
                          ? 'border-[#00D9FF] hover:border-[#FF6B35]'
                          : 'border-[#333333] hover:border-[#00D9FF]'
                      }`}
                      onClick={() => handleSelectDay(day)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{day}</span>
                        <div className="flex items-center gap-2">
                          {temTreino && (
                            <>
                              <span className="text-xs text-[#00D9FF] font-mono">{treinosDodia.length}</span>
                              <span className="w-2 h-2 bg-[#00D9FF] rounded-full"></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (selectedDay) {
                      handleCreateNewTreino(selectedDay);
                    } else {
                      alert('Selecione um dia para criar novo treino');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all duration-200"
                >
                  <Plus size={18} /> CRIAR NOVO
                </button>

                {selectedTreino && (
                  <>
                    <button
                      onClick={() => {
                        console.log(`📺 [WorkoutManager] Exibindo treino ${selectedTreino.id} na TV`);
                        setLocation(`/display?id=${selectedTreino.id}`);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200"
                    >
                      <Eye size={18} /> EXIBIR NA TV
                    </button>
                    <button
                      onClick={() => handleEditTreino(selectedTreino.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#FFD700] hover:bg-[#FFD700]/10 text-[#FFD700] font-bold rounded transition-all duration-200"
                    >
                      <Edit2 size={18} /> EDITAR
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTreino.id, selectedTreino.dayOfWeek)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-bold rounded transition-all duration-200"
                    >
                      <Trash2 size={18} /> DELETAR
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Workout Details */}
          <div className="lg:col-span-2">
            {selectedDay ? (
              <div className="space-y-6">
                {selectedTreino ? (
                  <div className="neon-box p-6 md:p-8 rounded-lg">
                    <div className="mb-6">
                      <h3 className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-2">
                        {selectedTreino.focusTechnique || 'Sem foco'}
                      </h3>
                      <p className="text-[#00D9FF] font-mono text-sm">
                        {selectedTreino.date || 'Sem data'}
                      </p>
                    </div>

                    {/* Sections */}
                    {selectedTreino.sections && selectedTreino.sections.length > 0 ? (
                      <div className="space-y-4">
                        {selectedTreino.sections.map((section, idx) => (
                          <div key={section.id} className="border-l-4 border-[#FF6B35] pl-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xl font-bold text-[#FF6B35]">{section.title}</h4>
                              <span className="text-[#00D9FF] text-sm font-mono">{section.durationMinutes}'</span>
                            </div>
                            {section.content && section.content.length > 0 && (
                              <ul className="space-y-1">
                                {section.content.map((item, itemIdx) => (
                                  <li key={itemIdx} className="text-white/70 text-sm flex items-start gap-2">
                                    <span className="text-[#FF6B35]">▸</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#AAAAAA]">Nenhuma seção adicionada</p>
                    )}
                  </div>
                ) : (
                  <div className="neon-box p-8 md:p-12 rounded-lg text-center">
                    <p className="text-[#AAAAAA] text-lg mb-4">
                      Nenhum treino criado para {selectedDay}
                    </p>
                    <button
                      onClick={() => handleCreateNewTreino(selectedDay)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all duration-200"
                    >
                      <Plus size={18} /> CRIAR TREINO
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="neon-box p-8 md:p-12 rounded-lg text-center">
                <p className="text-[#AAAAAA] text-lg">
                  Selecione um dia para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-12 pt-8 border-t border-[#333333]">
          <h3 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">RESUMO</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="neon-box p-4 rounded-lg text-center">
              <p className="text-[#AAAAAA] text-sm mb-2">TREINOS CRIADOS</p>
              <p className="text-3xl font-bold text-[#FF6B35]">{treinos.length}</p>
            </div>
            <div className="neon-box p-4 rounded-lg text-center">
              <p className="text-[#AAAAAA] text-sm mb-2">DIAS DISPONÍVEIS</p>
              <p className="text-3xl font-bold text-[#00D9FF]">{DAYS.length}</p>
            </div>
            <div className="neon-box p-4 rounded-lg text-center">
              <p className="text-[#AAAAAA] text-sm mb-2">FALTAM</p>
              <p className="text-3xl font-bold text-[#FFD700]">{DAYS.length - Object.keys(treinosPorDia).length}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}