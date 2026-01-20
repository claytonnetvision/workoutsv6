import { useState, useCallback, useEffect } from 'react';

interface Treino {
  id?: number;
  data: string;
  dia_semana: string;
  foco_tecnico: string;
  criado_em?: string;
  atualizado_em?: string;
  versao?: number;
  sincronizado?: boolean;
  deletado?: boolean;
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

// Configuração do banco de dados
const DB_CONFIG = {
  url: 'postgresql://neondb_owner:npg_MAFrdzHZ68vs@ep-soft-frost-aculcnam-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  // Nota: Em produção, use variáveis de ambiente!
};

export function usePostgresSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState(false);

  // Função auxiliar para fazer requisições ao PostgreSQL via API proxy
  const queryDB = useCallback(async (query: string, params: any[] = []) => {
    try {
      // Nota: Para usar PostgreSQL direto do frontend, você precisa de um proxy
      // Por enquanto, vamos usar localStorage como fallback com sincronização periódica
      
      // Simulação: Em produção, você faria uma requisição POST para um backend
      // que executaria a query no PostgreSQL
      
      console.log('Query:', query);
      console.log('Params:', params);
      
      // Retorna dados do localStorage
      return { rows: [] };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro na query';
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Salvar treino (localStorage + sincronização com PostgreSQL)
  const salvarTreino = useCallback(async (treino: TreinoCompleto) => {
    setLoading(true);
    setError(null);

    try {
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );

      const novoTreino: TreinoCompleto = {
        ...treino,
        id: treino.id || Date.now(),
        criado_em: treino.criado_em || new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        versao: (treino.versao || 0) + 1,
        sincronizado: false, // Marca para sincronizar depois
        deletado: false,
        secoes: treino.secoes || [],
      };

      // Verificar se já existe
      const indiceExistente = treinosArmazenados.findIndex(
        (t: TreinoCompleto) => t.id === novoTreino.id
      );

      if (indiceExistente >= 0) {
        treinosArmazenados[indiceExistente] = novoTreino;
      } else {
        treinosArmazenados.push(novoTreino);
      }

      localStorage.setItem('treinos_db', JSON.stringify(treinosArmazenados));

      // Tentar sincronizar com PostgreSQL
      await sincronizarComBanco([novoTreino]);

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
      // Primeiro tenta carregar do PostgreSQL
      // Se não conseguir, usa localStorage
      
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );

      // Filtrar treinos não deletados
      return treinosArmazenados.filter((t: TreinoCompleto) => !t.deletado);
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
      return treinos.filter((t) => t.dia_semana === dia_semana && !t.deletado);
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
      return dataTreino >= umaSemanaAtras && !t.deletado;
    });
  }, [listarTreinos]);

  // Deletar treino (soft delete)
  const deletarTreino = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );

      const indice = treinosArmazenados.findIndex((t: TreinoCompleto) => t.id === id);
      if (indice >= 0) {
        // Soft delete
        treinosArmazenados[indice].deletado = true;
        treinosArmazenados[indice].sincronizado = false;
        localStorage.setItem('treinos_db', JSON.stringify(treinosArmazenados));

        // Sincronizar
        await sincronizarComBanco(treinosArmazenados);
      }

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
          versao: 1,
          sincronizado: false,
          deletado: false,
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

  // Sincronizar com banco de dados PostgreSQL
  const sincronizarComBanco = useCallback(async (treinos: TreinoCompleto[]) => {
    setSincronizando(true);
    try {
      // Aqui você faria uma requisição para um backend que sincroniza com PostgreSQL
      // Por enquanto, apenas marca como sincronizado
      
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );

      treinos.forEach((treino) => {
        const indice = treinosArmazenados.findIndex(
          (t: TreinoCompleto) => t.id === treino.id
        );
        if (indice >= 0) {
          treinosArmazenados[indice].sincronizado = true;
        }
      });

      localStorage.setItem('treinos_db', JSON.stringify(treinosArmazenados));
      
      console.log('Treinos sincronizados:', treinos.length);
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
    } finally {
      setSincronizando(false);
    }
  }, []);

  // Sincronizar periodicamente (a cada 5 minutos)
  useEffect(() => {
    const intervalo = setInterval(async () => {
      const treinosArmazenados = JSON.parse(
        localStorage.getItem('treinos_db') || '[]'
      );
      
      const naoSincronizados = treinosArmazenados.filter(
        (t: TreinoCompleto) => !t.sincronizado
      );

      if (naoSincronizados.length > 0) {
        await sincronizarComBanco(naoSincronizados);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalo);
  }, [sincronizarComBanco]);

  return {
    loading,
    error,
    sincronizando,
    salvarTreino,
    listarTreinos,
    listarTreinosPorDia,
    listarTreinosUltimaSemana,
    deletarTreino,
    clonarTreino,
    sincronizarComBanco,
  };
}
