import { useState, useEffect } from 'react';

export interface WorkoutData {
  id?: number;
  date: string;
  dayOfWeek: string;
  focusTechnique: string;
  sections: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    content: string[];
  }>;
}

const API_BASE = 'https://workouts6-back.onrender.com/api';

export function useTreinosAPI() {
  const [treinos, setTreinos] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTreinos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos`);
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      const data = await response.json();

      // Mapeamento básico (sem sections na listagem geral)
      const mapped = data.map((t: any) => ({
        id: t.id,
        date: t.data,
        dayOfWeek: t.dia_semana,
        focusTechnique: t.foco_tecnico,
        sections: [], // ← intencional: lista geral não traz sections
      }));

      console.log('Treinos carregados (lista resumida):', mapped.length, 'itens');
      setTreinos(mapped);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro fetchTreinos:', msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchTreinoPorDia = async (dia: string): Promise<WorkoutData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos/dia/${encodeURIComponent(dia)}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Erro HTTP ${response.status}`);
      }
      const data = await response.json();

      return {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: (data.sections || []).map((s: any) => ({
          id: s.id?.toString() || crypto.randomUUID(),
          title: s.nome_secao,
          durationMinutes: s.duracao_minutos,
          content: typeof s.conteudo === 'string' ? s.conteudo.split('\n').filter(Boolean) : [],
        })),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro fetchTreinoPorDia:', msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchTreinoById = async (id: number): Promise<WorkoutData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Erro HTTP ${response.status}`);
      }
      const data = await response.json();

      return {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: (data.sections || []).map((s: any) => ({
          id: s.id?.toString() || crypto.randomUUID(),
          title: s.nome_secao,
          durationMinutes: s.duracao_minutos,
          content: typeof s.conteudo === 'string' ? s.conteudo.split('\n').filter(Boolean) : [],
        })),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro fetchTreinoById:', msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveTreino = async (workout: WorkoutData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: workout.date,
          dia_semana: workout.dayOfWeek,
          foco_tecnico: workout.focusTechnique,
          secoes: workout.sections.map((s, idx) => ({
            nome_secao: s.title,
            duracao_minutos: s.durationMinutes,
            conteudo: s.content.join('\n'),
            ordem: idx,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao salvar: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Treino criado com ID:', data.id);

      await fetchTreinos(); // recarrega a lista
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro saveTreino:', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateTreino = async (id: number, workout: WorkoutData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          data: workout.date,
          dia_semana: workout.dayOfWeek,
          foco_tecnico: workout.focusTechnique,
          secoes: workout.sections.map((s, idx) => ({
            nome_secao: s.title,
            duracao_minutos: s.durationMinutes,
            conteudo: s.content.join('\n'),
            ordem: idx,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao atualizar: ${response.status} - ${errorText}`);
      }

      console.log('Treino atualizado ID:', id);
      await fetchTreinos(); // recarrega lista
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro updateTreino:', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteTreino = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/treinos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar: ${response.status} - ${errorText}`);
      }

      console.log('Treino deletado ID:', id);
      await fetchTreinos();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(msg);
      console.error('Erro deleteTreino:', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    treinos,
    loading,
    error,
    fetchTreinos,
    fetchTreinoPorDia,
    fetchTreinoById,
    saveTreino,
    updateTreino,
    deleteTreino,
  };
}