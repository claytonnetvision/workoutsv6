import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { Trash2, Plus, Eye, Edit2, Upload } from 'lucide-react';
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

  // Carrega todos os treinos do banco ao montar a página
  useEffect(() => {
    fetchTreinos();
  }, [fetchTreinos]);

  // Quando seleciona um treino → carrega os detalhes completos (incluindo seções)
  useEffect(() => {
    if (!selectedTreinoId) {
      setSelectedTreinoCompleto(null);
      return;
    }

    const loadDetails = async () => {
      setDetailLoading(true);
      const full = await fetchTreinoById(selectedTreinoId);
      setSelectedTreinoCompleto(full);
      setDetailLoading(false);
    };

    loadDetails();
  }, [selectedTreinoId, fetchTreinoById]);

  // Agrupa treinos por dia da semana
  const treinosPorDia = treinos.reduce((acc, treino) => {
    const day = treino.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(treino);
    return acc;
  }, {} as Record<string, WorkoutData[]>);

  const handleDelete = async (id: number, dia: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o treino de ${dia}?`)) return;
    const success = await deleteTreino(id);
    if (success) {
      alert('✅ Treino deletado com sucesso!');
      setSelectedTreinoId(null);
      setSelectedTreinoCompleto(null);
    } else {
      alert('❌ Erro ao deletar treino');
    }
  };

  const handleEdit = (id: number) => {
    setLocation(`/editor?id=${id}`);
  };

  const handleView = (day: string) => {
    setLocation(`/display?day=${encodeURIComponent(day)}`);
  };

  const handleCreateNew = (day: string) => {
    setLocation(`/editor?day=${encodeURIComponent(day)}`);
  };

  const selectedTreinosDoDia = selectedDay ? treinosPorDia[selectedDay] || [] : [];
  const hasTreinoNoDia = selectedTreinosDoDia.length > 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
        <div className="container py-5 md:py-6">
          <h1 className="neon-text text-3xl md:text-4xl font-bold tracking-wider mb-2">
            GERENCIAR TREINOS
          </h1>
          <p className="text-[#AAAAAA] text-sm md:text-base">
            Crie, edite, visualize e organize os treinos da semana
          </p>
        </div>
      </header>

      <main className="container py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Coluna 1: Lista de dias */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">DIAS DA SEMANA</h2>

            <div className="space-y-3">
              {DAYS.map((day) => {
                const count = treinosPorDia[day]?.length || 0;
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      if (treinosPorDia[day]?.length) {
                        setSelectedTreinoId(treinosPorDia[day][0].id ?? null);
                      } else {
                        setSelectedTreinoId(null);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? 'neon-box border-[#FF6B35] bg-[#FF6B35]/5'
                        : count > 0
                        ? 'border-[#00D9FF]/50 hover:border-[#FF6B35]'
                        : 'border-[#333333] hover:border-[#00D9FF]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base">{day}</span>
                      {count > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#00D9FF] font-mono">{count}</span>
                          <div className="w-2 h-2 bg-[#00D9FF] rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botão de upload PDF */}
            <div className="mt-8">
              <button
                onClick={() => setLocation('/pdf-upload')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-bold rounded transition-all"
              >
                <Upload size={18} /> UPLOAD PDF / AUTO-IMPORT
              </button>
            </div>
          </div>

          {/* Coluna 2-3: Detalhes do treino selecionado */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="text-center py-20 text-[#AAAAAA]">Carregando treinos do banco...</div>
            ) : !selectedDay ? (
              <div className="neon-box p-10 text-center rounded-lg">
                <p className="text-xl text-[#AAAAAA]">Selecione um dia à esquerda para ver os treinos</p>
              </div>
            ) : detailLoading ? (
              <div className="text-center py-20">Carregando detalhes do treino...</div>
            ) : selectedTreinoCompleto ? (
              <div className="neon-box p-6 md:p-8 rounded-lg">
                {/* Cabeçalho do treino */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#FF6B35] mb-2">
                      {selectedTreinoCompleto.focusTechnique || 'Sem foco definido'}
                    </h3>
                    <p className="text-[#00D9FF] font-mono">
                      {selectedTreinoCompleto.date || 'Sem data'} • {selectedDay}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleView(selectedDay)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00D9FF]/20 hover:bg-[#00D9FF]/30 border border-[#00D9FF] text-[#00D9FF] font-bold rounded transition"
                    >
                      <Eye size={18} /> EXIBIR NA TV
                    </button>
                    <button
                      onClick={() => handleEdit(selectedTreinoCompleto.id!)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35]/20 hover:bg-[#FF6B35]/30 border border-[#FF6B35] text-[#FF6B35] font-bold rounded transition"
                    >
                      <Edit2 size={18} /> EDITAR
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTreinoCompleto.id!, selectedDay)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500 text-red-400 font-bold rounded transition"
                    >
                      <Trash2 size={18} /> DELETAR
                    </button>
                  </div>
                </div>

                {/* Seções do treino */}
                {selectedTreinoCompleto.sections.length > 0 ? (
                  <div className="space-y-6">
                    {selectedTreinoCompleto.sections.map((section, idx) => (
                      <div key={section.id} className="border-l-4 border-[#FF6B35] pl-5 py-3">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xl font-bold text-white">{section.title}</h4>
                          <span className="text-[#00D9FF] font-mono text-sm">
                            {section.durationMinutes} minutos
                          </span>
                        </div>
                        {section.content.length > 0 && (
                          <ul className="space-y-2 mt-3">
                            {section.content.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-gray-300">
                                <span className="text-[#FF6B35] mt-1">▸</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[#AAAAAA] py-10">
                    Este treino não tem seções cadastradas ainda
                  </p>
                )}
              </div>
            ) : (
              <div className="neon-box p-10 text-center rounded-lg">
                <p className="text-xl text-[#AAAAAA] mb-6">
                  Nenhum treino criado para {selectedDay}
                </p>
                <button
                  onClick={() => handleCreateNew(selectedDay)}
                  className="px-8 py-4 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold text-lg rounded transition"
                >
                  <Plus className="inline mr-2" size={20} /> CRIAR TREINO AGORA
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Resumo rápido no final */}
        <div className="mt-12 pt-8 border-t border-[#333333] text-center">
          <p className="text-[#AAAAAA]">
            Total de treinos no banco: <span className="text-[#FF6B35] font-bold">{treinos.length}</span>
          </p>
        </div>
      </main>
    </div>
  );
}