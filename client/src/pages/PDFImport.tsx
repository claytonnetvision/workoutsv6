import { useState } from 'react';
import { useLocation } from 'wouter';
import { usePDFParser, ParsedWorkout } from '@/hooks/usePDFParser';
import { useTreinosAPI } from '@/hooks/useTreinosAPI';
import { Upload, Check, AlertCircle, ChevronLeft, Trash2, Edit2 } from 'lucide-react';

export default function PDFImport() {
  const [, setLocation] = useLocation();
  const { processPDF, loading: pdfLoading, error: pdfError, parsedWorkouts } = usePDFParser();
  const { saveTreino, loading: apiLoading } = useTreinosAPI();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [workoutsToImport, setWorkoutsToImport] = useState<ParsedWorkout[]>([]);
  const [editingWorkout, setEditingWorkout] = useState<ParsedWorkout | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('📁 [PDFImport] Arquivo selecionado:', file.name);
      setSelectedFile(file);
      setShowPreview(false);
      setImportedCount(0);
    }
  };

  const handleProcessPDF = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo PDF');
      return;
    }

    console.log('🔄 [PDFImport] Processando PDF...');
    const workouts = await processPDF(selectedFile);
    
    if (workouts.length > 0) {
      setWorkoutsToImport(workouts);
      setShowPreview(true);
      console.log(`✅ [PDFImport] ${workouts.length} treinos extraídos`);
    } else {
      alert('Erro ao processar PDF. Verifique o formato.');
    }
  };

  const handleImportAll = async () => {
    console.log(`🚀 [PDFImport] Iniciando importação de ${workoutsToImport.length} treinos...`);
    setImporting(true);
    let successCount = 0;

    try {
      for (const workout of workoutsToImport) {
        console.log(`📥 [PDFImport] Importando: ${workout.dayOfWeek}`);
        
        const success = await saveTreino({
          date: workout.date,
          dayOfWeek: workout.dayOfWeek,
          focusTechnique: workout.focusTechnique,
          sections: workout.sections.map((s, idx) => ({
            id: `section-${idx}`,
            title: s.title,
            durationMinutes: s.durationMinutes,
            content: s.content,
          })),
        });

        if (success) {
          successCount++;
          setImportedCount(successCount);
          console.log(`✅ [PDFImport] Treino importado: ${workout.dayOfWeek}`);
        } else {
          console.error(`❌ [PDFImport] Erro ao importar: ${workout.dayOfWeek}`);
        }
      }

      console.log(`🎉 [PDFImport] Importação concluída: ${successCount}/${workoutsToImport.length}`);
      alert(`✅ ${successCount} treinos importados com sucesso!`);
      
      // Resetar
      setShowPreview(false);
      setWorkoutsToImport([]);
      setSelectedFile(null);
      setImportedCount(0);
      
      // Redirecionar para manager
      setTimeout(() => {
        setLocation('/manager');
      }, 1000);
    } catch (err) {
      console.error('❌ [PDFImport] Erro durante importação:', err);
      alert('Erro ao importar treinos');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteWorkout = (index: number) => {
    console.log(`🗑️ [PDFImport] Deletando treino ${index}`);
    setWorkoutsToImport(workoutsToImport.filter((_, i) => i !== index));
  };

  const handleEditWorkout = (workout: ParsedWorkout) => {
    console.log(`✏️ [PDFImport] Editando treino: ${workout.dayOfWeek}`);
    setEditingWorkout(workout);
  };

  const handleSaveEdit = (editedWorkout: ParsedWorkout) => {
    console.log(`💾 [PDFImport] Salvando edição: ${editedWorkout.dayOfWeek}`);
    setWorkoutsToImport(
      workoutsToImport.map(w => 
        w.date === editedWorkout.date ? editedWorkout : w
      )
    );
    setEditingWorkout(null);
  };

  if (editingWorkout) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setEditingWorkout(null)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
              >
                <ChevronLeft size={16} /> VOLTAR
              </button>
            </div>
            <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
              EDITAR TREINO
            </h1>
          </div>
        </header>

        {/* Edit Form */}
        <main className="container py-12">
          <div className="max-w-2xl mx-auto neon-box p-8 rounded-lg">
            <div className="space-y-6">
              {/* Foco Técnico */}
              <div>
                <label className="block text-sm font-mono text-[#AAAAAA] mb-2">FOCO TÉCNICO</label>
                <input
                  type="text"
                  value={editingWorkout.focusTechnique}
                  onChange={(e) => setEditingWorkout({
                    ...editingWorkout,
                    focusTechnique: e.target.value
                  })}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-white focus:border-[#FF6B35] outline-none"
                />
              </div>

              {/* Sections */}
              <div>
                <label className="block text-sm font-mono text-[#AAAAAA] mb-4">SEÇÕES</label>
                <div className="space-y-4">
                  {editingWorkout.sections.map((section, idx) => (
                    <div key={idx} className="border border-[#333333] p-4 rounded">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                          type="text"
                          placeholder="Título"
                          value={section.title}
                          onChange={(e) => {
                            const newSections = [...editingWorkout.sections];
                            newSections[idx].title = e.target.value;
                            setEditingWorkout({
                              ...editingWorkout,
                              sections: newSections
                            });
                          }}
                          className="px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-white text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Minutos"
                          value={section.durationMinutes}
                          onChange={(e) => {
                            const newSections = [...editingWorkout.sections];
                            newSections[idx].durationMinutes = parseInt(e.target.value) || 0;
                            setEditingWorkout({
                              ...editingWorkout,
                              sections: newSections
                            });
                          }}
                          className="px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-white text-sm"
                        />
                      </div>
                      <textarea
                        placeholder="Conteúdo (um item por linha)"
                        value={section.content.join('\n')}
                        onChange={(e) => {
                          const newSections = [...editingWorkout.sections];
                          newSections[idx].content = e.target.value.split('\n').filter(line => line.trim());
                          setEditingWorkout({
                            ...editingWorkout,
                            sections: newSections
                          });
                        }}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#333333] rounded text-white text-sm h-24"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={() => handleSaveEdit(editingWorkout)}
                className="w-full px-6 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 text-black font-bold rounded transition-all duration-200"
              >
                💾 SALVAR EDIÇÃO
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
          <div className="container py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
              >
                <ChevronLeft size={16} /> VOLTAR
              </button>
              <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
                PREVIEW
              </h1>
            </div>
          </div>
        </header>

        {/* Preview Content */}
        <main className="container py-12">
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="neon-box p-4 rounded-lg text-center">
                <p className="text-[#AAAAAA] text-sm mb-2">TREINOS ENCONTRADOS</p>
                <p className="text-3xl font-bold text-[#FF6B35]">{workoutsToImport.length}</p>
              </div>
              <div className="neon-box p-4 rounded-lg text-center">
                <p className="text-[#AAAAAA] text-sm mb-2">IMPORTADOS</p>
                <p className="text-3xl font-bold text-[#00D9FF]">{importedCount}</p>
              </div>
              <div className="neon-box p-4 rounded-lg text-center">
                <p className="text-[#AAAAAA] text-sm mb-2">FALTAM</p>
                <p className="text-3xl font-bold text-[#FFD700]">{workoutsToImport.length - importedCount}</p>
              </div>
            </div>

            {/* Workouts List */}
            <div className="space-y-4">
              {workoutsToImport.map((workout, idx) => (
                <div key={idx} className="neon-box p-6 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#FF6B35] mb-2">
                        {workout.dayOfWeek}
                      </h3>
                      <p className="text-[#00D9FF] font-mono text-sm mb-2">
                        {workout.date} • {workout.focusTechnique}
                      </p>
                      <p className="text-[#AAAAAA] text-sm">
                        {workout.sections.length} seções
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditWorkout(workout)}
                        className="p-2 border border-[#FFD700] hover:bg-[#FFD700]/10 text-[#FFD700] rounded transition-all duration-200"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkout(idx)}
                        className="p-2 border border-[#FF006E] hover:bg-[#FF006E]/10 text-[#FF006E] rounded transition-all duration-200"
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Sections Preview */}
                  <div className="space-y-2">
                    {workout.sections.map((section, sidx) => (
                      <div key={sidx} className="text-sm text-[#AAAAAA] ml-4">
                        <p className="font-mono">
                          {section.title} • {section.durationMinutes}'
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 px-6 py-3 border-2 border-[#FF6B35] hover:bg-[#FF6B35]/10 text-[#FF6B35] font-bold rounded transition-all duration-200"
              >
                ← VOLTAR
              </button>
              <button
                onClick={handleImportAll}
                disabled={importing || apiLoading}
                className="flex-1 px-6 py-3 bg-[#00D9FF] hover:bg-[#00D9FF]/80 disabled:bg-[#00D9FF]/50 text-black font-bold rounded transition-all duration-200 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    IMPORTANDO... ({importedCount}/{workoutsToImport.length})
                  </>
                ) : (
                  <>
                    <Check size={18} /> IMPORTAR TUDO
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-[#FF6B35] bg-black/80 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation('/manager')}
              className="flex items-center gap-2 px-3 py-2 border-2 border-[#00D9FF] hover:bg-[#00D9FF]/10 text-[#00D9FF] font-bold rounded transition-all duration-200 text-sm"
            >
              <ChevronLeft size={16} /> VOLTAR
            </button>
          </div>
          <h1 className="neon-text text-2xl md:text-4xl font-bold tracking-wider">
            IMPORTAR TREINOS
          </h1>
          <p className="text-[#AAAAAA] text-sm mt-2">
            Faça upload de um PDF com os treinos da semana
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          <div className="neon-box p-12 rounded-lg text-center mb-8">
            <div className="mb-6">
              <Upload size={48} className="mx-auto text-[#FF6B35] mb-4" />
              <h2 className="text-2xl font-bold text-[#FF6B35] mb-2">
                Selecione um PDF
              </h2>
              <p className="text-[#AAAAAA] text-sm">
                Formato esperado: Tabela com dias da semana e treinos
              </p>
            </div>

            <div className="mb-6">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-input"
              />
              <label
                htmlFor="pdf-input"
                className="inline-block px-6 py-3 bg-[#FF6B35] hover:bg-[#FF8555] text-black font-bold rounded cursor-pointer transition-all duration-200"
              >
                📁 ESCOLHER ARQUIVO
              </label>
            </div>

            {selectedFile && (
              <div className="text-[#00D9FF] text-sm font-mono">
                ✅ {selectedFile.name}
              </div>
            )}
          </div>

          {/* Error Message */}
          {pdfError && (
            <div className="mb-6 p-4 bg-[#FF006E]/10 border border-[#FF006E] rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-[#FF006E] flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[#FF006E]">Erro</p>
                <p className="text-sm text-[#AAAAAA]">{pdfError}</p>
              </div>
            </div>
          )}

          {/* Process Button */}
          <button
            onClick={handleProcessPDF}
            disabled={!selectedFile || pdfLoading}
            className="w-full px-6 py-4 bg-[#00D9FF] hover:bg-[#00D9FF]/80 disabled:bg-[#00D9FF]/50 text-black font-bold text-lg rounded transition-all duration-200 flex items-center justify-center gap-2"
          >
            {pdfLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                PROCESSANDO...
              </>
            ) : (
              <>
                <Upload size={20} /> PROCESSAR PDF
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-8 p-6 border border-[#333333] rounded-lg">
            <h3 className="font-bold text-[#FF6B35] mb-3">📋 Formato Esperado</h3>
            <ul className="text-sm text-[#AAAAAA] space-y-2">
              <li>✅ Tabela com colunas para cada dia da semana</li>
              <li>✅ Primeira linha: Data (ex: 19/jan, 20/jan)</li>
              <li>✅ Técnica de foco (ex: THRUSTER, CLEAN, SNATCH)</li>
              <li>✅ Seções: Mobility, Warm-up, Skill, Strength, WOD</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
