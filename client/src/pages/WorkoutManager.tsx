import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { Trash2, Plus, Eye, Edit2 } from 'lucide-react';
import { WorkoutData } from '@/hooks/useTreinosAPI';

const DAYS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

export default function WorkoutManager() {
  const [, setLocation] = useLocation();
  const { treinos, fetchTreinos, deleteTreino, fetchTreinoById, loading } = useTreinosAPI();

  const [selectedTreinoId, setSelectedTreinoId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTreinoCompleto, setSelectedTreinoCompleto] = useState<WorkoutData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Carrega lista inicial
  useEffect(() => {
    fetchTreinos();
  }, [fetchTreinos]);

  // Quando seleciona um treino → carrega detalhes completos (com sections)
  useEffect(() => {
    if (!selectedTreinoId) {
      setSelectedTreinoCompleto(null);
      return;
    }

    const loadDetails = async () => {
      setDetailLoading(true);
      try {
        const fullTreino = await fetchTreinoById(selectedTreinoId);
        setSelectedTreinoCompleto(fullTreino);
      } catch (err) {
        console.error('Erro ao carregar detalhes:', err);
        setSelectedTreinoCompleto(null);
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetails();
  }, [selectedTreinoId, fetchTreinoById]);

  // Agrupa treinos por dia
  const treinosPorDia = treinos.reduce((acc, treino) => {
    const day = treino.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(treino);
    return acc;
  }, {} as Record<string, WorkoutData[]>);

  const handleDelete = async (id: number, dia: string) => {
    if (!window.confirm(`Deletar treino de ${dia}?`)) return;
    const success = await deleteTreino(id);
    if (success) {
      alert('Treino deletado!');
      setSelectedTreinoId(null);
    } else {
      alert('Erro ao deletar.');
    }
  };

  const handleEdit = (id: number) => {
    setLocation(`/editor?id=${id}`);
  };

  const handleCreateForDay = (day: string) => {
    setLocation(`/editor?day=${encodeURIComponent(day)}`);
  };

  const selectedTreino = treinos.find(t => t.id === selectedTreinoId);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/90 backdrop-blur-sm">
        <div className="container py-5">
          <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-[#FF6B35]">
            GERENCIAR TREINOS
          </h1>
          <p className="text-[#AAAAAA] mt-1">Crie, edite e organize os treinos da semana</p>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Coluna esquerda - Dias */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-mono text-[#FF6B35] mb-4 tracking-widest">DIAS DA SEMANA</h2>

            <div className="space-y-2">
              {DAYS.map(day => {
                const treinosDoDia = treinosPorDia[day] || [];
                const isSelected = selectedDay === day;
                const hasTreino = treinosDoDia.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedTreinoId(hasTreino ? treinosDoDia[0].id ?? null : null);
                    }}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                        : hasTreino
                        ? 'border-[#00D9FF]/40 hover:border-[#FF6B35]'
                        : 'border-[#333] hover:border-[#00D9FF]/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{day}</span>
                      {hasTreino && (
                        <span className="text-xs bg-[#00D9FF]/20 px-2 py-1 rounded-full">
                          {treinosDoDia.length}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div className="mt-6">
                <button
                  onClick={() => handleCreateForDay(selectedDay)}
                  className="w-full py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition"
                >
                  + Criar treino para {selectedDay.split('-')[0]}
                </button>
              </div>
            )}
          </div>

          {/* Coluna direita - Detalhes */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-20">Carregando treinos...</div>
            ) : !selectedDay ? (
              <div className="text-center py-20 text-[#AAAAAA]">
                Selecione um dia à esquerda
              </div>
            ) : detailLoading ? (
              <div className="text-center py-20">Carregando detalhes...</div>
            ) : selectedTreinoCompleto ? (
              <div className="bg-[#111] border border-[#333] rounded-xl p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-[#FF6B35]">
                      {selectedTreinoCompleto.focusTechnique || 'Treino sem foco definido'}
                    </h2>
                    <p className="text-[#00D9FF] font-mono mt-1">
                      {selectedTreinoCompleto.date || '—'}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(selectedTreinoCompleto.id!)}
                      className="p-2 border border-[#00D9FF]/50 hover:bg-[#00D9FF]/10 rounded"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() =>
                        selectedTreinoCompleto.id && handleDelete(selectedTreinoCompleto.id, selectedDay)
                      }
                      className="p-2 border border-red-500/50 hover:bg-red-500/10 rounded text-red-400"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                {selectedTreinoCompleto.sections.length > 0 ? (
                  <div className="space-y-6 mt-8">
                    {selectedTreinoCompleto.sections.map((sec, i) => (
                      <div key={sec.id} className="border-l-4 border-[#FF6B35] pl-5 py-2">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xl font-bold text-white">{sec.title}</h3>
                          <span className="text-[#00D9FF] font-mono">{sec.durationMinutes} min</span>
                        </div>
                        <ul className="space-y-2 text-gray-300">
                          {sec.content.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="text-[#FF6B35] mt-1">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#888] mt-10 text-center">Nenhuma seção cadastrada</p>
                )}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-[#444] rounded-xl">
                <p className="text-xl text-[#AAAAAA] mb-4">
                  Nenhum treino cadastrado para {selectedDay}
                </p>
                <button
                  onClick={() => handleCreateForDay(selectedDay)}
                  className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded"
                >
                  Criar treino agora
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}