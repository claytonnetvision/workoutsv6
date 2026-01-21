import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { ChevronLeft, Copy, Filter, X, Calendar, Search, Eye } from 'lucide-react';

interface Treino {
  id: number;
  date: string;
  dayOfWeek: string;
  focusTechnique: string;
  sections?: Array<{
    id: string;
    title: string;
    durationMinutes: number;
    content: string[];
  }>;
}

export default function WorkoutLibrary() {
  const [, setLocation] = useLocation();
  const { treinos, fetchTreinos, saveTreino, loading } = useTreinosAPI();
  
  const [filteredTreinos, setFilteredTreinos] = useState<Treino[]>([]);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [selectedTechniqueFilter, setSelectedTechniqueFilter] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedApplyDay, setSelectedApplyDay] = useState<string>('Segunda-feira');
  const [applying, setApplying] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [minDate, setMinDate] = useState<string>('');

  const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  // ✅ Carregar treinos ao montar
  useEffect(() => {
    console.log('📚 [WorkoutLibrary] Componente montado');
    fetchTreinos();
  }, []);

  // ✅ Encontrar data mínima
  useEffect(() => {
    if (treinos.length > 0) {
      const dates = treinos.map(t => t.date).sort();
      const minDateValue = dates[0];
      console.log(`📅 [WorkoutLibrary] Data mínima: ${minDateValue}`);
      setMinDate(minDateValue);
    }
  }, [treinos]);

  // ✅ Formatar data para exibição
  const formatDate = (dateStr: string): string => {
    try {
      const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
      const date = new Date(datePart + 'T00:00:00');
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    } catch (err) {
      console.error('❌ [WorkoutLibrary] Erro ao formatar data:', err);
      return dateStr;
    }
  };

  // ✅ Filtrar treinos com todos os critérios
  useEffect(() => {
    console.log('🔍 [WorkoutLibrary] Aplicando filtros...');
    let filtered = [...treinos];

    if (selectedDayFilter) {
      console.log(`  Filtrando por dia: ${selectedDayFilter}`);
      filtered = filtered.filter(t => t.dayOfWeek === selectedDayFilter);
    }

    if (selectedTechniqueFilter.trim()) {
      console.log(`  Filtrando por técnica: ${selectedTechniqueFilter}`);
      filtered = filtered.filter(t => 
        t.focusTechnique.toUpperCase().includes(selectedTechniqueFilter.toUpperCase())
      );
    }

    if (selectedDateFilter) {
      console.log(`  Filtrando por data: ${selectedDateFilter}`);
      filtered = filtered.filter(t => {
        const treinoDate = t.date.includes('T') ? t.date.split('T')[0] : t.date;
        return treinoDate === selectedDateFilter;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    console.log(`  Resultado: ${filtered.length} treinos`);
    setFilteredTreinos(filtered);
  }, [treinos, selectedDayFilter, selectedTechniqueFilter, selectedDateFilter, sortOrder]);

  // ✅ Aplicar treino na semana atual
  const handleApplyTreino = async () => {
    if (!selectedTreino) return;

    console.log(`📋 [WorkoutLibrary] Aplicando treino: ${selectedTreino.focusTechnique}`);
    console.log(`  Para o dia: ${selectedApplyDay}`);
    
    setApplying(true);

    try {
      const today = new Date();
      const newDate = today.toISOString().split('T')[0];

      const newTreino = {
        date: newDate,
        dayOfWeek: selectedApplyDay,
        focusTechnique: selectedTreino.focusTechnique,
        sections: selectedTreino.sections || [],
      };

      console.log(`💾 [WorkoutLibrary] Salvando novo treino:`, newTreino);

      const success = await saveTreino(newTreino);

      if (success) {
        console.log('✅ [WorkoutLibrary] Treino aplicado com sucesso!');
        alert(`✅ Treino "${selectedTreino.focusTechnique}" aplicado para ${selectedApplyDay}!`);
        
        setShowApplyModal(false);
        setShowViewModal(false);
        setSelectedTreino(null);
        
        setTimeout(() => {
          setLocation('/manager');
        }, 1000);
      } else {
        console.error('❌ [WorkoutLibrary] Erro ao aplicar treino');
        alert('❌ Erro ao aplicar treino');
      }
    } catch (err) {
      console.error('❌ [WorkoutLibrary] Erro:', err);
      alert('❌ Erro ao aplicar treino');
    } finally {
      setApplying(false);
    }
  };

  const clearAllFilters = () => {
    console.log('🧹 [WorkoutLibrary] Limpando todos os filtros');
    setSelectedDayFilter(null);
    setSelectedTechniqueFilter('');
    setSelectedDateFilter(null);
  };

  const hasActiveFilters = selectedDayFilter || selectedTechniqueFilter.trim() || selectedDateFilter;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
        <div className="container py-4 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/manager')}
              className="flex items-center gap-2 px-3 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
            >
              <ChevronLeft size={16} /> VOLTAR
            </button>
          </div>
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
            BIBLIOTECA DE TREINOS
          </h1>
          <p className="text-[#AAAAAA] text-sm mt-2">
            Histórico completo - Reutilize treinos antigos aplicando na semana atual
          </p>
        </div>
      </header>

      {/* Info Banner */}
      {minDate && (
        <div className="bg-[#1a1a1a] border-b border-[#333333] py-3">
          <div className="container">
            <p className="text-[#AAAAAA] text-sm">
              📅 Treinos disponíveis desde <span className="text-[#00D9FF] font-bold">{formatDate(minDate)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Filters */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <h2 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4 flex items-center gap-2">
                <Filter size={18} /> FILTROS
              </h2>

              {/* Data com Calendário */}
              <div className="mb-6">
                <p className="text-sm font-mono text-[#AAAAAA] mb-3 flex items-center gap-2">
                  <Calendar size={14} /> DATA
                </p>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={selectedDateFilter || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log(`📅 [WorkoutLibrary] Data selecionada: ${value}`);
                      setSelectedDateFilter(value || null);
                    }}
                    min={minDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border-2 border-[#333333] rounded text-white font-mono text-sm focus:border-[#FF6B35] outline-none"
                  />
                  
                  {selectedDateFilter && (
                    <button
                      onClick={() => {
                        console.log('🧹 [WorkoutLibrary] Limpando filtro de data');
                        setSelectedDateFilter(null);
                      }}
                      className="w-full px-3 py-2 border border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-mono text-xs rounded transition-all duration-200"
                    >
                      ✕ Limpar Data
                    </button>
                  )}

                  <p className="text-xs text-[#666666] mt-2">
                    Selecione uma data para filtrar
                  </p>
                </div>
              </div>

              {/* Dia da Semana */}
              <div className="mb-6">
                <p className="text-sm font-mono text-[#AAAAAA] mb-3">DIA DA SEMANA</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDayFilter(null)}
                    className={`w-full text-left px-3 py-2 rounded font-mono text-xs transition-all duration-200 ${
                      selectedDayFilter === null
                        ? 'neon-box text-[#FF6B35]'
                        : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                    }`}
                  >
                    Todos
                  </button>
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDayFilter(day)}
                      className={`w-full text-left px-3 py-2 rounded font-mono text-xs transition-all duration-200 ${
                        selectedDayFilter === day
                          ? 'neon-box text-[#FF6B35]'
                          : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Técnica - BUSCA DE TEXTO */}
              <div className="mb-6">
                <p className="text-sm font-mono text-[#AAAAAA] mb-3 flex items-center gap-2">
                  <Search size={14} /> TÉCNICA
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Digite a técnica..."
                    value={selectedTechniqueFilter}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log(`🔍 [WorkoutLibrary] Buscando técnica: ${value}`);
                      setSelectedTechniqueFilter(value);
                    }}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border-2 border-[#333333] rounded text-white font-mono text-sm focus:border-[#FF6B35] outline-none placeholder-[#666666]"
                  />
                  
                  {selectedTechniqueFilter && (
                    <button
                      onClick={() => {
                        console.log('🧹 [WorkoutLibrary] Limpando filtro de técnica');
                        setSelectedTechniqueFilter('');
                      }}
                      className="w-full px-3 py-2 border border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-mono text-xs rounded transition-all duration-200"
                    >
                      ✕ Limpar Busca
                    </button>
                  )}

                  <p className="text-xs text-[#666666] mt-2">
                    Busca em tempo real
                  </p>
                </div>
              </div>

              {/* Ordenação */}
              <div className="mb-6">
                <p className="text-sm font-mono text-[#AAAAAA] mb-3">ORDENAÇÃO</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setSortOrder('desc')}
                    className={`w-full text-left px-3 py-2 rounded font-mono text-xs transition-all duration-200 ${
                      sortOrder === 'desc'
                        ? 'neon-box text-[#FF6B35]'
                        : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                    }`}
                  >
                    Mais Recentes
                  </button>
                  <button
                    onClick={() => setSortOrder('asc')}
                    className={`w-full text-left px-3 py-2 rounded font-mono text-xs transition-all duration-200 ${
                      sortOrder === 'asc'
                        ? 'neon-box text-[#FF6B35]'
                        : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                    }`}
                  >
                    Mais Antigos
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-4 py-2 border-2 border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] font-bold rounded transition-all duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <X size={16} /> LIMPAR FILTROS
                </button>
              )}
            </div>
          </div>

          {/* Right: Treinos List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-[#AAAAAA]">⏳ Carregando treinos...</p>
              </div>
            ) : filteredTreinos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-[#AAAAAA]">
                    {filteredTreinos.length} treino(s) encontrado(s)
                  </p>
                  <p className="text-xs text-[#666666]">
                    Total no histórico: {treinos.length}
                  </p>
                </div>

                {filteredTreinos.map((treino) => (
                  <div
                    key={treino.id}
                    onClick={() => setSelectedTreino(treino)}
                    className={`p-6 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                      selectedTreino?.id === treino.id
                        ? 'neon-box border-[#FF6B35]'
                        : 'border-[#333333] hover:border-[#FF6B35]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-[#FF6B35] mb-2">
                          {treino.focusTechnique}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="text-[#00D9FF] font-mono text-xs bg-[#00D9FF]/10 px-2 py-1 rounded">
                            {treino.dayOfWeek}
                          </span>
                          <span className="text-[#FFD700] font-mono text-xs bg-[#FFD700]/10 px-2 py-1 rounded">
                            {formatDate(treino.date)}
                          </span>
                        </div>
                        <p className="text-[#AAAAAA] text-sm">
                          {treino.sections?.length || 0} seções • ID: {treino.id}
                        </p>
                      </div>
                      {selectedTreino?.id === treino.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowViewModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black font-bold rounded transition-all duration-200"
                          >
                            <Eye size={16} /> VISUALIZAR
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowApplyModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black font-bold rounded transition-all duration-200"
                          >
                            <Copy size={16} /> APLICAR
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sections Preview */}
                    {treino.sections && treino.sections.length > 0 && (
                      <div className="space-y-2 ml-4 text-sm text-[#AAAAAA]">
                        {treino.sections.map((section, idx) => (
                          <p key={idx} className="font-mono">
                            {section.title} • {section.durationMinutes}'
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="neon-box p-12 rounded-lg text-center">
                <p className="text-[#AAAAAA] text-lg">
                  Nenhum treino encontrado com os filtros selecionados
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* View Modal - NOVO */}
      {showViewModal && selectedTreino && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="neon-box p-8 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-[#FF6B35]">
                {selectedTreino.focusTechnique}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-[#333333] rounded transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Info */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="text-[#00D9FF] font-mono text-sm bg-[#00D9FF]/10 px-3 py-1 rounded">
                {selectedTreino.dayOfWeek}
              </span>
              <span className="text-[#FFD700] font-mono text-sm bg-[#FFD700]/10 px-3 py-1 rounded">
                {formatDate(selectedTreino.date)}
              </span>
              <span className="text-[#FF6B35] font-mono text-sm bg-[#FF6B35]/10 px-3 py-1 rounded">
                ID: {selectedTreino.id}
              </span>
            </div>

            {/* Sections - COMPLETO */}
            {selectedTreino.sections && selectedTreino.sections.length > 0 ? (
              <div className="space-y-6">
                <h3 className="text-lg font-mono tracking-widest text-[#FF6B35] mb-4">
                  SEÇÕES ({selectedTreino.sections.length})
                </h3>

                {selectedTreino.sections.map((section, idx) => (
                  <div key={section.id} className="border-l-4 border-[#FF6B35] pl-4 py-2">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-bold text-[#FF6B35]">
                        {idx + 1}. {section.title}
                      </h4>
                      <span className="text-[#00D9FF] font-mono text-sm bg-[#00D9FF]/10 px-2 py-1 rounded">
                        {section.durationMinutes}'
                      </span>
                    </div>

                    {/* Conteúdo da Seção */}
                    {section.content && section.content.length > 0 ? (
                      <ul className="space-y-2 ml-4">
                        {section.content.map((item, itemIdx) => (
                          <li key={itemIdx} className="text-white/80 text-sm flex items-start gap-3">
                            <span className="text-[#FF6B35] font-bold mt-0.5">▸</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#AAAAAA] text-sm italic">Nenhum conteúdo adicionado</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#AAAAAA]">❌ Nenhuma seção adicionada</p>
            )}

            {/* Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-[#333333]">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-4 py-3 border-2 border-[#FF6B35] hover:bg-[#FF6B35]/10 text-[#FF6B35] font-bold rounded transition-all duration-200"
              >
                FECHAR
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setShowApplyModal(true);
                }}
                className="flex-1 px-4 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black font-bold rounded transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Copy size={16} /> APLICAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApplyModal && selectedTreino && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="neon-box p-8 rounded-lg max-w-md w-full">
            <h2 className="text-2xl font-bold text-[#FF6B35] mb-6">
              APLICAR TREINO
            </h2>

            <p className="text-[#AAAAAA] mb-4">
              Selecione o dia da semana para aplicar o treino:
            </p>

            <div className="mb-4">
              <p className="text-[#00D9FF] font-bold mb-2">
                "{selectedTreino.focusTechnique}"
              </p>
              <p className="text-[#AAAAAA] text-sm">
                Original: {formatDate(selectedTreino.date)}
              </p>
            </div>

            {/* Day Selection */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedApplyDay(day)}
                  className={`px-3 py-2 rounded font-mono text-xs transition-all duration-200 ${
                    selectedApplyDay === day
                      ? 'neon-box text-[#FF6B35]'
                      : 'border border-[#333333] text-[#AAAAAA] hover:border-[#FF6B35]'
                  }`}
                >
                  {day.split('-')[0]}
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="bg-[#1a1a1a] p-4 rounded mb-6 text-sm text-[#AAAAAA]">
              <p className="mb-2">
                ✅ Treino será criado para: <span className="text-[#00D9FF]">{selectedApplyDay}</span>
              </p>
              <p>
                📅 Data: <span className="text-[#00D9FF]">{new Date().toLocaleDateString('pt-BR')}</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-3 border-2 border-[#FF6B35] hover:bg-[#FF6B35]/10 text-[#FF6B35] font-bold rounded transition-all duration-200"
              >
                CANCELAR
              </button>
              <button
                onClick={handleApplyTreino}
                disabled={applying}
                className="flex-1 px-4 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 disabled:bg-[#00D9FF]/50 text-black font-bold rounded transition-all duration-200 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    APLICANDO...
                  </>
                ) : (
                  <>
                    <Copy size={16} /> APLICAR
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
