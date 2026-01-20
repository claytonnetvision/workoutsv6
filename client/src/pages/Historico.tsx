import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePostgresDB } from '@/hooks/usePostgresDB';
import { Trash2, Copy, ArrowLeft } from 'lucide-react';

interface TreinoCompleto {
  id?: number;
  data: string;
  dia_semana: string;
  foco_tecnico: string;
  secoes: any[];
  criado_em?: string;
}

export default function Historico() {
  const [, setLocation] = useLocation();
  const { listarTreinos, deletarTreino, clonarTreino } = usePostgresDB();
  const [treinos, setTreinos] = useState<TreinoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('todos');

  useEffect(() => {
    carregarTreinos();
  }, []);

  const carregarTreinos = async () => {
    setLoading(true);
    const treinosCarregados = await listarTreinos();
    setTreinos(
      treinosCarregados.sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      )
    );
    setLoading(false);
  };

  const handleDeletar = async (id: number, dia: string) => {
    if (window.confirm(`Tem certeza que deseja deletar o treino de ${dia}?`)) {
      await deletarTreino(id);
      carregarTreinos();
    }
  };

  const handleClonar = async (treino: TreinoCompleto) => {
    const novaData = prompt(
      'Nova data (YYYY-MM-DD):',
      new Date().toISOString().split('T')[0]
    );
    if (novaData) {
      await clonarTreino(treino.id!, novaData, treino.dia_semana);
      carregarTreinos();
      alert('Treino clonado com sucesso!');
    }
  };

  // Filtrar treinos
  const treinosFiltrados = filtro === 'todos' 
    ? treinos 
    : treinos.filter(t => t.dia_semana === filtro);

  const diasUnicos = Array.from(new Set(treinos.map(t => t.dia_semana)));

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
              <ArrowLeft size={18} /> VOLTAR
            </button>
          </div>
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider mb-2">
            📚 HISTÓRICO DE TREINOS
          </h1>
          <p className="text-[#AAAAAA] text-sm">Visualize, clone e reutilize treinos anteriores</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Filtro */}
        <div className="mb-8">
          <h3 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">FILTRAR POR DIA</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded font-bold transition-all ${
                filtro === 'todos'
                  ? 'bg-[#FF6B35] text-black'
                  : 'border-2 border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35]/10'
              }`}
            >
              Todos ({treinos.length})
            </button>
            {diasUnicos.map(dia => {
              const count = treinos.filter(t => t.dia_semana === dia).length;
              return (
                <button
                  key={dia}
                  onClick={() => setFiltro(dia)}
                  className={`px-4 py-2 rounded font-bold transition-all ${
                    filtro === dia
                      ? 'bg-[#00D9FF] text-black'
                      : 'border-2 border-[#00D9FF] text-[#00D9FF] hover:bg-[#00D9FF]/10'
                  }`}
                >
                  {dia} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Treinos */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#AAAAAA]">Carregando treinos...</p>
          </div>
        ) : treinosFiltrados.length === 0 ? (
          <div className="text-center py-12 neon-box p-8 rounded-lg">
            <p className="text-[#AAAAAA] mb-4">Nenhum treino salvo ainda.</p>
            <button
              onClick={() => setLocation('/manager')}
              className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded transition-all"
            >
              Criar Primeiro Treino
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {treinosFiltrados.map((treino) => (
              <div
                key={treino.id}
                className="neon-box p-6 rounded-lg border-2 border-[#FF6B35] hover:border-[#00D9FF] transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-[#FF6B35]">
                        {treino.dia_semana}
                      </h3>
                      <span className="text-sm px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] rounded">
                        {treino.foco_tecnico}
                      </span>
                    </div>
                    <p className="text-[#00D9FF] font-mono text-sm mb-2">
                      📅 {new Date(treino.data).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-[#AAAAAA] text-xs">
                      Criado em: {new Date(treino.criado_em!).toLocaleString('pt-BR')}
                    </p>
                    {treino.secoes && treino.secoes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#333333]">
                        <p className="text-sm text-[#AAAAAA] mb-2">Seções:</p>
                        <div className="flex flex-wrap gap-2">
                          {treino.secoes.map((secao, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-[#00D9FF]/10 text-[#00D9FF] rounded"
                            >
                              {secao.nome_secao || secao.title} ({secao.duracao_minutos || secao.durationMinutes}')
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleClonar(treino)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black font-bold rounded transition-all whitespace-nowrap"
                    >
                      <Copy size={16} /> Clonar
                    </button>
                    <button
                      onClick={() => handleDeletar(treino.id!, treino.dia_semana)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-bold rounded transition-all whitespace-nowrap"
                    >
                      <Trash2 size={16} /> Deletar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
