import { useEffect, useState } from 'react';
import { usePostgresDB } from '@/hooks/usePostgresDB';

interface TreinoCompleto {
  id?: number;
  data: string;
  dia_semana: string;
  foco_tecnico: string;
  secoes: any[];
  criado_em?: string;
}

export default function Historico() {
  const { listarTreinos, deletarTreino, clonarTreino } = usePostgresDB();
  const [treinos, setTreinos] = useState<TreinoCompleto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTreinos();
  }, []);

  const carregarTreinos = async () => {
    setLoading(true);
    const treinosCarregados = await listarTreinos();
    setTreinos(treinosCarregados.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    ));
    setLoading(false);
  };

  const handleDeletar = async (id: number) => {
    if (confirm('Tem certeza que deseja deletar este treino?')) {
      await deletarTreino(id);
      carregarTreinos();
    }
  };

  const handleClonar = async (treino: TreinoCompleto) => {
    const novaData = prompt('Nova data (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (novaData) {
      await clonarTreino(treino.id!, novaData, treino.dia_semana);
      carregarTreinos();
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Histórico de Treinos</h1>
      
      {treinos.length === 0 ? (
        <p>Nenhum treino salvo ainda.</p>
      ) : (
        <div className="grid gap-4">
          {treinos.map((treino) => (
            <div key={treino.id} className="border p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{treino.dia_semana}</h3>
                  <p className="text-sm text-gray-600">{treino.data}</p>
                  <p className="text-sm">Foco: {treino.foco_tecnico}</p>
                  <p className="text-xs text-gray-500">
                    Criado em: {new Date(treino.criado_em!).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleClonar(treino)}
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                  >
                    📋 Clonar
                  </button>
                  <button 
                    onClick={() => handleDeletar(treino.id!)}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                  >
                    🗑️ Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}