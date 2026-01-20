import { useState, useCallback } from 'react';

interface Treino {
  id?: number;
  data: string;
  dia_semana: string;
  foco_tecnico: string;
  criado_em?: string;
  atualizado_em?: string;
}

interface SecaoTreino {
  id?: number;
  treino_id?: number;
  nome_secao: string;
  duracao_minutos: number;
  conteudo: string;
  ordem: number;
}

interface TreinoCompleto extends Treino {
  secoes: SecaoTreino[];
}

export function usePostgresDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://api.neon.tech/api/v1'; // Placeholder - você vai usar um proxy
  const DB_URL = import.meta.env.VITE_POSTGRES_URL;

  // Salvar treino no banco de dados
  const salvarTreino = useCallback(async (treino: TreinoCompleto) => {
    setLoading(true);
    setError(null);

    try {
      // Nota: Para usar diretamente do frontend, você precisa de um proxy
      // Por enquanto, vamos usar localStorage como fallback
      
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_historico') || '[]'
      );

      const novoTreino = {
        ...treino,
        id: Date.now(), // ID temporário
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      };

      treinosArmazenados.push(novoTreino);
      localStorage.setItem('treinos_historico', JSON.stringify(treinosArmazenados));

      return novoTreino;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar treino';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Listar todos os treinos
  const listarTreinos = useCallback(async (): Promise<TreinoCompleto[]> => {
    setLoading(true);
    setError(null);

    try {
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_historico') || '[]'
      );
      return treinosArmazenados;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao listar treinos';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Listar treinos por dia da semana
  const listarTreinosPorDia = useCallback(
    async (dia_semana: string): Promise<TreinoCompleto[]> => {
      const treinos = await listarTreinos();
      return treinos.filter((t) => t.dia_semana === dia_semana);
    },
    [listarTreinos]
  );

  // Listar treinos da última semana
  const listarTreinosUltimaSemana = useCallback(async (): Promise<TreinoCompleto[]> => {
    const treinos = await listarTreinos();
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);

    return treinos.filter((t) => {
      const dataTreino = new Date(t.data);
      return dataTreino >= umaSemanaAtras;
    });
  }, [listarTreinos]);

  // Deletar treino
  const deletarTreino = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_historico') || '[]'
      );

      const treinosFiltrados = treinosArmazenados.filter((t: TreinoCompleto) => t.id !== id);
      localStorage.setItem('treinos_historico', JSON.stringify(treinosFiltrados));

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar treino';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clonar treino
  const clonarTreino = useCallback(
    async (id: number, novaData: string, novoDia: string): Promise<TreinoCompleto | null> => {
      setLoading(true);
      setError(null);

      try {
        const treinos = await listarTreinos();
        const treinoOriginal = treinos.find((t) => t.id === id);

        if (!treinoOriginal) {
          throw new Error('Treino não encontrado');
        }

        const treinoClonado: TreinoCompleto = {
          ...treinoOriginal,
          id: Date.now(),
          data: novaData,
          dia_semana: novoDia,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };

        await salvarTreino(treinoClonado);
        return treinoClonado;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erro ao clonar treino';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [listarTreinos, salvarTreino]
  );

  return {
    loading,
    error,
    salvarTreino,
    listarTreinos,
    listarTreinosPorDia,
    listarTreinosUltimaSemana,
    deletarTreino,
    clonarTreino,
  };
}
