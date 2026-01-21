import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// ✅ Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedWorkout {
  date: string;
  dayOfWeek: string;
  focusTechnique: string;
  sections: Array<{
    title: string;
    durationMinutes: number;
    content: string[];
  }>;
}

export function usePDFParser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedWorkouts, setParsedWorkouts] = useState<ParsedWorkout[]>([]);

  // ✅ Mapear mês/ano para data
  const parseDate = (dayStr: string, monthYear: string): string => {
    try {
      // monthYear format: "19/jan" → "2026-01-19"
      const parts = dayStr.split('/');
      const day = parts[0];
      
      const monthMap: Record<string, string> = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
        'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
      };
      
      const monthParts = monthYear.toLowerCase().split('/');
      const month = monthMap[monthParts[0]] || '01';
      const year = monthParts[1] || '2026';
      
      return `${year}-${month}-${String(day).padStart(2, '0')}`;
    } catch (e) {
      console.error('❌ [usePDFParser] Erro ao parsear data:', e);
      return new Date().toISOString().split('T')[0];
    }
  };

  // ✅ Mapear dia da semana em português
  const getDayOfWeek = (date: string): string => {
    const d = new Date(date);
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[d.getDay()];
  };

  // ✅ Extrair texto do PDF
  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    console.log('📄 [usePDFParser] Iniciando extração do PDF...');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      console.log(`📊 [usePDFParser] PDF carregado com ${pdf.numPages} página(s)`);
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      console.log('✅ [usePDFParser] Texto extraído com sucesso');
      return fullText;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePDFParser] Erro ao extrair PDF:', errorMsg);
      throw new Error(`Erro ao extrair PDF: ${errorMsg}`);
    }
  }, []);

  // ✅ Parsear texto extraído
  const parseWorkoutsFromText = useCallback((text: string): ParsedWorkout[] => {
    console.log('🔍 [usePDFParser] Parseando texto do PDF...');
    
    try {
      const workouts: ParsedWorkout[] = [];
      
      // ✅ Padrão: "19/jan" ou "20/jan"
      const dayPattern = /(\d{1,2})\/([a-z]{3})/gi;
      const matches = Array.from(text.matchAll(dayPattern));
      
      console.log(`📋 [usePDFParser] Encontrados ${matches.length} dias`);
      
      matches.forEach((match, idx) => {
        const dayStr = match[1];
        const monthStr = match[2];
        const fullDateStr = `${dayStr}/${monthStr}`;
        
        console.log(`🔄 [usePDFParser] Processando dia ${idx + 1}: ${fullDateStr}`);
        
        // ✅ Extrair foco técnico (próxima linha após o dia)
        const dayIndex = match.index || 0;
        const afterDay = text.substring(dayIndex + match[0].length, dayIndex + 200);
        
        // Procurar por palavras-chave de técnicas
        const techniques = ['THRUSTER', 'CLEAN', 'RING MUSCLE UP', 'SNATCH', 'CONDITIONING', 'JERK', 'SQUAT', 'DEADLIFT'];
        let focusTechnique = 'Treino';
        
        for (const tech of techniques) {
          if (afterDay.toUpperCase().includes(tech)) {
            focusTechnique = tech;
            break;
          }
        }
        
        const date = parseDate(dayStr, monthStr);
        const dayOfWeek = getDayOfWeek(date);
        
        console.log(`  📅 Data: ${date}`);
        console.log(`  📆 Dia: ${dayOfWeek}`);
        console.log(`  💪 Foco: ${focusTechnique}`);
        
        // ✅ Criar seções padrão
        const sections = [
          {
            title: 'Mobility',
            durationMinutes: 3,
            content: ['Mobilidade geral'],
          },
          {
            title: 'Warm-up',
            durationMinutes: 8,
            content: ['Aquecimento específico'],
          },
          {
            title: 'Skill',
            durationMinutes: 15,
            content: ['Trabalho técnico do dia'],
          },
          {
            title: 'Strength',
            durationMinutes: 10,
            content: ['Força do dia'],
          },
          {
            title: '#WOD',
            durationMinutes: 20,
            content: ['Workout of the Day'],
          },
        ];
        
        workouts.push({
          date,
          dayOfWeek,
          focusTechnique,
          sections,
        });
      });
      
      console.log(`✅ [usePDFParser] ${workouts.length} treinos parseados com sucesso`);
      return workouts;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePDFParser] Erro ao parsear:', errorMsg);
      throw new Error(`Erro ao parsear: ${errorMsg}`);
    }
  }, []);

  // ✅ Função principal: processar PDF
  const processPDF = useCallback(async (file: File): Promise<ParsedWorkout[]> => {
    console.log('🚀 [usePDFParser] Iniciando processamento do PDF');
    setLoading(true);
    setError(null);
    
    try {
      // 1️⃣ Extrair texto
      const text = await extractTextFromPDF(file);
      
      // 2️⃣ Parsear treinos
      const workouts = parseWorkoutsFromText(text);
      
      if (workouts.length === 0) {
        throw new Error('Nenhum treino encontrado no PDF');
      }
      
      // 3️⃣ Salvar em estado
      setParsedWorkouts(workouts);
      
      console.log('✅ [usePDFParser] Processamento concluído com sucesso');
      return workouts;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [usePDFParser] Erro no processamento:', errorMsg);
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [extractTextFromPDF, parseWorkoutsFromText]);

  return {
    loading,
    error,
    parsedWorkouts,
    processPDF,
    setParsedWorkouts,
  };
}
