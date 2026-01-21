import { useState, useCallback } from 'react';
import { WorkoutData } from '@/components/WorkoutForm';

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

  // Carregar sections de um treino
  const fetchSections = useCallback(async (treinoId: number) => {
    try {
      console.log(`📡 [useTreinosAPI] Carregando sections para treino ${treinoId}`);
      const url = `${API_BASE}/treinos/${treinoId}/secoes`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`⚠️ [useTreinosAPI] Sections não encontradas para ${treinoId}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`✅ [useTreinosAPI] Sections carregadas: ${data.length}`);
      
      // Mapear sections do banco para o formato esperado
      const mappedSections = data.map((s: any) => ({
        id: s.id || `section-${Math.random()}`,
        title: s.nome_secao || s.title || '',
        durationMinutes: s.duracao_minutos || s.durationMinutes || 0,
        content: typeof s.conteudo === 'string' 
          ? s.conteudo.split('\n').filter((line: string) => line.trim())
          : (s.content || []),
      }));
      
      console.log(`🔄 [useTreinosAPI] Sections mapeadas:`, mappedSections);
      return mappedSections;
    } catch (err) {
      console.error(`❌ [useTreinosAPI] Erro ao carregar sections:`, err);
      return [];
    }
  }, []);

  // Recuperar todos os treinos
  const fetchTreinos = useCallback(async () => {
    console.log('🔄 [useTreinosAPI] Iniciando fetchTreinos...');
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos`;
      console.log('📡 [useTreinosAPI] GET:', url);
      
      const response = await fetch(url);
      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [useTreinosAPI] Treinos recebidos:', data.length);
      
      // ✅ Mapear treinos E carregar sections para cada um
      const mappedData = await Promise.all(data.map(async (t: any) => {
        console.log(`🔄 [useTreinosAPI] Processando treino ID ${t.id}`);
        
        // Carregar sections para este treino
        const sections = await fetchSections(t.id);
        
        return {
          id: t.id,
          date: t.data,
          dayOfWeek: t.dia_semana,
          focusTechnique: t.foco_tecnico,
          sections: sections,
        };
      }));
      
      console.log('✅ [useTreinosAPI] Todos os treinos processados:', mappedData.length);
      setTreinos(mappedData);
      return mappedData;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useTreinosAPI] Erro ao buscar:', errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchSections]);

  // Recuperar treino de um dia específico
  const fetchTreinoPorDia = useCallback(async (dia: string): Promise<WorkoutData | null> => {
    console.log(`🔍 [useTreinosAPI] Buscando treino para dia: ${dia}`);
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos/dia/${encodeURIComponent(dia)}`;
      console.log('📡 [useTreinosAPI] GET:', url);
      
      const response = await fetch(url);
      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        console.warn(`⚠️ [useTreinosAPI] Treino não encontrado para ${dia}`);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ [useTreinosAPI] Treino encontrado');
      
      // ✅ Carregar sections para este treino
      const sections = await fetchSections(data.id);
      
      const mapped: WorkoutData = {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: sections,
      };
      
      console.log('🔄 [useTreinosAPI] Treino com sections:', mapped);
      return mapped;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ [useTreinosAPI] Erro ao buscar dia ${dia}:`, errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSections]);

  // Recuperar treino por ID
  const fetchTreinoById = useCallback(async (id: number): Promise<WorkoutData | null> => {
    console.log(`🔍 [useTreinosAPI] Buscando treino por ID: ${id}`);
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos/${id}`;
      console.log('📡 [useTreinosAPI] GET:', url);
      
      const response = await fetch(url);
      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        console.warn(`⚠️ [useTreinosAPI] Treino não encontrado com ID ${id}`);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ [useTreinosAPI] Treino encontrado');
      
      // ✅ Carregar sections para este treino
      const sections = await fetchSections(data.id);
      
      const mapped: WorkoutData = {
        id: data.id,
        date: data.data,
        dayOfWeek: data.dia_semana,
        focusTechnique: data.foco_tecnico,
        sections: sections,
      };
      
      console.log('🔄 [useTreinosAPI] Treino com sections:', mapped);
      return mapped;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ [useTreinosAPI] Erro ao buscar ID ${id}:`, errorMsg);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSections]);

  // Salvar novo treino
  const saveTreino = useCallback(async (workout: WorkoutData): Promise<boolean> => {
    console.log('💾 [useTreinosAPI] Salvando novo treino');
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos`;
      
      const payload = {
        data: workout.date,
        dia_semana: workout.dayOfWeek,
        foco_tecnico: workout.focusTechnique,
        secoes: workout.sections.map((s, idx) => ({
          nome_secao: s.title,
          duracao_minutos: s.durationMinutes,
          conteudo: s.content.join('\n'),
          ordem: idx,
        })),
      };
      
      console.log('📦 [useTreinosAPI] Payload enviado:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [useTreinosAPI] Erro response:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      console.log('✅ [useTreinosAPI] Treino salvo com sucesso');
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error('❌ [useTreinosAPI] Erro ao salvar:', errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTreinos]);

  // Atualizar treino
  const updateTreino = useCallback(async (id: number, workout: WorkoutData): Promise<boolean> => {
    console.log(`🔄 [useTreinosAPI] Atualizando treino ${id}`);
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos/${id}`;
      
      const payload = {
        data: workout.date,
        dia_semana: workout.dayOfWeek,
        foco_tecnico: workout.focusTechnique,
        secoes: workout.sections.map((s, idx) => ({
          nome_secao: s.title,
          duracao_minutos: s.durationMinutes,
          conteudo: s.content.join('\n'),
          ordem: idx,
        })),
      };
      
      console.log('📦 [useTreinosAPI] Payload enviado:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [useTreinosAPI] Erro response:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      console.log('✅ [useTreinosAPI] Treino atualizado com sucesso');
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error(`❌ [useTreinosAPI] Erro ao atualizar ${id}:`, errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTreinos]);

  // Deletar treino
  const deleteTreino = useCallback(async (id: number): Promise<boolean> => {
    console.log(`🗑️ [useTreinosAPI] Deletando treino ${id}`);
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/treinos/${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📊 [useTreinosAPI] Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ [useTreinosAPI] Erro response:', errorData);
        throw new Error(`Erro ${response.status}: ${errorData}`);
      }
      
      console.log(`✅ [useTreinosAPI] Treino ${id} deletado com sucesso`);
      
      // Recarregar treinos
      await fetchTreinos();
      
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
      console.error(`❌ [useTreinosAPI] Erro ao deletar ${id}:`, errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTreinos]);

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
