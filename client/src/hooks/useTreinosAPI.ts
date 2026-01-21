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

// ✅ API_BASE APONTANDO PARA RENDER - PRODUÇÃO
const API_BASE = 'https://workouts6-back.onrender.com/api';

export function useTreinosAPI() {
  const [treinos, setTreinos] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recuperar todos os treinos
  const fetchTreinos = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE} - NÃO USAR /api/treinos
      const response = await fetch(`${API_BASE}/treinos`);
      if (!response.ok) throw new Error('Erro ao recuperar treinos');
      const data = await response.json();
      setTreinos(data.map((t: any) => ({
        id: t.id,
        date: t.data,
        dayOfWeek: t.dia_semana,
        focusTechnique: t.foco_tecnico,
        sections: [],
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Recuperar treino de um dia específico
  const fetchTreinoPorDia = async (dia: string): Promise<WorkoutData | null> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE}
      const response = await fetch(`${API_BASE}/treinos/dia/${encodeURIComponent(dia)}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: data.sections || [],
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Recuperar treino por ID
  const fetchTreinoById = async (id: number): Promise<WorkoutData | null> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE}
      const response = await fetch(`${API_BASE}/treinos/${id}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: data.sections || [],
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Salvar novo treino
  const saveTreino = async (workout: WorkoutData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE}
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
        const errorData = await response.text();
        throw new Error(`Erro ao salvar treino: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log('✅ Treino salvo com sucesso:', data);
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ Erro ao salvar treino:', errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar treino
  const updateTreino = async (id: number, workout: WorkoutData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE}
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
        const errorData = await response.text();
        throw new Error(`Erro ao atualizar treino: ${response.status} - ${errorData}`);
      }
      
      console.log('✅ Treino atualizado com sucesso');
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ Erro ao atualizar treino:', errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deletar treino
  const deleteTreino = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // ✅ USANDO ${API_BASE}
      const response = await fetch(`${API_BASE}/treinos/${id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao deletar treino: ${response.status} - ${errorData}`);
      }
      
      console.log('✅ Treino deletado com sucesso');
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ Erro ao deletar treino:', errorMsg);
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