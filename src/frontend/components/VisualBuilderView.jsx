import React, { useState, useEffect } from 'react';
import { BuilderPagesBar } from './builder/BuilderPagesBar.jsx';
import { BuilderPalette } from './builder/BuilderPalette.jsx';
import { EditableBlockCard } from './builder/EditableBlockCard.jsx';
import { BuilderAiModal } from './builder/BuilderAiModal.jsx';
import { normalizeBlockType } from './BlockRenderer.jsx';

const DEFAULT_LESSON = {
  title: 'New Interactive English Lesson',
  level: 'B1',
  topic: 'General English',
  description: 'Interactive lesson created with Visual Builder',
  pages: [
    {
      id: 'page-1',
      title: 'Часть 1: Введение',
      blocks: [
        { id: 'b-1', type: 'heading', level: 1, text: 'Welcome to the Lesson' },
        { id: 'b-2', type: 'text', text: 'Read the following story carefully and complete all interactive tasks below.' }
      ]
    }
  ]
};

export const VisualBuilderView = ({ initialLesson, onSaveLesson, onChangeLesson, onCancel }) => {
  const [lesson, setLesson] = useState(initialLesson || DEFAULT_LESSON);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const [aiModalTarget, setAiModalTarget] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedTasks, setSelectedTasks] = useState(['listening']);
  const [matchingType, setMatchingType] = useState('synonym');
  const [flashcardType, setFlashcardType] = useState('russian');
  const [modalLevel, setModalLevel] = useState('B1');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Drag-and-drop state (isolated strictly to the handle)
  const [draggableCardIdx, setDraggableCardIdx] = useState(null);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  // Inline Quick-Insert Menu state
  const [activeInsertMenuIdx, setActiveInsertMenuIdx] = useState(null);

  const updateLessonState = (updater) => {
    setLesson(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (onChangeLesson) onChangeLesson(next);
      return next;
    });
  };

  useEffect(() => {
    if (initialLesson) {
      const normalized = { ...initialLesson };
      if (!normalized.pages || !Array.isArray(normalized.pages) || normalized.pages.length === 0) {
        if (normalized.blocks && Array.isArray(normalized.blocks)) {
          normalized.pages = [{ id: 'p1', title: 'Часть 1', blocks: normalized.blocks }];
        } else {
          normalized.pages = [{ id: 'p1', title: 'Часть 1', blocks: [] }];
        }
      }
      setLesson(normalized);
      setModalLevel(normalized.level || 'B1');
    }
  }, [initialLesson]);

  const activePage = lesson.pages?.[activePageIndex] || lesson.pages?.[0] || { blocks: [] };

  const availableSourceBlocks = React.useMemo(() => {
    const list = [];
    lesson.pages?.forEach(p => {
      if (p && Array.isArray(p.blocks)) {
        p.blocks.forEach(b => {
          if (b && (b.type === 'text' || b.type === 'video' || b.type === 'audio' || b.type === 'grammar_card' || b.type === 'link')) {
            list.push(b);
          }
        });
      }
    });
    return list;
  }, [lesson]);

  const extractLessonContext = (overrideBlockId) => {
    if (overrideBlockId) {
      const found = availableSourceBlocks.find(b => b.id === overrideBlockId);
      if (found) {
        if (found.type === 'grammar_card') {
          return `Grammar Rule: ${found.title || ''}\nFormula: ${found.formula || ''}\nExplanation: ${found.explanation || ''}\nExamples: ${(found.examples || []).join('; ')}`;
        }
        if (found.type === 'video' || found.type === 'audio') {
          return `Title: ${found.title || 'Media Presentation'}\nTranscript / Content:\n${found.transcript || found.text || ''}`;
        }
        if (found.type === 'link') {
          return `Resource Title: ${found.title || 'Web Link'}\nURL: ${found.url || ''}\nDescription: ${found.description || ''}`;
        }
        return found.text || found.transcript || found.explanation || found.description || JSON.stringify(found);
      }
    }
    let contextText = '';
    lesson.pages?.forEach(page => {
      if (page && Array.isArray(page.blocks)) {
        page.blocks.forEach(b => {
          if (b && b.type === 'text' && b.text) contextText += b.text + '\n';
          if (b && (b.type === 'video' || b.type === 'audio')) {
            contextText += `Media (${b.title || 'Presentation'}):\n${b.transcript || ''}\n`;
          }
          if (b && b.type === 'link' && b.description) contextText += `${b.title}: ${b.description}\n`;
          if (b && b.type === 'grammar_card') {
            contextText += `Grammar Rule (${b.title}): Formula: ${b.formula || ''} - Explanation: ${b.explanation || ''}\n`;
          }
        });
      }
    });
    return contextText || lesson.title || 'General English Practice';
  };

  const handleAddPage = () => {
    const newPage = { id: 'page-' + Date.now(), title: `Часть ${(lesson.pages?.length || 0) + 1}`, blocks: [] };
    updateLessonState(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
    setActivePageIndex(lesson.pages?.length || 0);
  };

  const handleDeletePage = (idx) => {
    if ((lesson.pages?.length || 0) <= 1) return;
    const updatedPages = lesson.pages.filter((_, i) => i !== idx);
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
    setActivePageIndex(Math.max(0, idx - 1));
  };

  const handleUpdatePageTitle = (newTitle) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], title: newTitle };
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
  };

  const createDefaultBlock = (rawType) => {
    const type = normalizeBlockType(rawType);
    const newBlock = { id: 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6), type };

    if (rawType === 'true_false') {
      newBlock.type = 'multiple_choice';
      newBlock.question = 'Утверждение по материалу (True / False):';
      newBlock.options = ['True', 'False'];
      newBlock.correct = 0;
    }
    else if (type === 'heading') { 
      newBlock.level = 2; 
      newBlock.text = 'Новый раздел'; 
    }
    else if (type === 'text') { 
      newBlock.text = 'Введите текст статьи или рассказа здесь...'; 
    }
    else if (type === 'link') {
      newBlock.title = 'Полезный ресурс';
      newBlock.url = 'https://en.wikipedia.org';
      newBlock.description = 'Нажмите для просмотра справочных материалов.';
      newBlock.displayMode = 'modal';
    }
    else if (type === 'video') { 
      newBlock.title = 'Посмотрите видео:'; 
      newBlock.url = ''; 
      newBlock.transcript = '';
    }
    else if (type === 'audio') { 
      newBlock.title = 'Прослушайте аудиозапись:'; 
      newBlock.url = ''; 
      newBlock.transcript = ''; 
    }
    else if (type === 'image') { 
      newBlock.caption = ''; 
      newBlock.images = []; 
    }
    else if (type === 'grammar_card') { 
      newBlock.title = 'Правило грамматики'; 
      newBlock.formula = 'Subject + Verb'; 
      newBlock.explanation = 'Объяснение правила...'; 
      newBlock.examples = ['Пример предложения в контексте.']; 
    }
    else if (type === 'teacher_notes') { 
      newBlock.aim = 'To introduce target vocabulary in communicative context...'; 
      newBlock.speech = 'Look at these sentences and discuss what you notice.'; 
    }
    else if (type === 'inline_select') { 
      newBlock.instruction = 'Выберите правильный вариант:'; 
      newBlock.text = '1. We should [focus on* | ignore] the main goal.\n2. By next year they [will have completed* | completed] the project.'; 
    }
    else if (type === 'spinning_wheel') { 
      newBlock.title = 'Discussion Roulette'; 
      newBlock.instruction = 'Крутите колесо и ответьте на выпавший вопрос!'; 
      newBlock.items = [
        'What was the most surprising revelation?', 
        'How does this relate to contemporary events?', 
        'What alternative solution would you propose?'
      ]; 
      newBlock.eliminateMode = true; 
    }
    else if (type === 'flashcards') { 
      newBlock.title = 'Ключевые слова'; 
      newBlock.cards = [
        { front: 'Key Concept', back: 'Основная идея', example: 'Understanding this key concept will help you grasp the whole lesson.' }, 
        { front: 'To engage with', back: 'Взаимодействовать', example: 'Students should engage with the material through interactive discussions.' }
      ]; 
    }
    else if (type === 'multiple_choice') { 
      newBlock.question = 'Вопрос по материалу?'; 
      newBlock.options = ['Правильный вариант', 'Дистрактор 1', 'Дистрактор 2']; 
      newBlock.correct = 0; 
    }
    else if (type === 'gap_fill') { 
      newBlock.instruction = 'Вставьте пропущенное слово:'; 
      newBlock.text = '1. Yesterday she [went] home.\n2. They [have seen] this movie before.'; 
      newBlock.answers = ['went', 'have seen']; 
    }
    else if (type === 'gap_fill_bank') { 
      newBlock.instruction = 'Заполните пропуски словами из банка:'; 
      newBlock.text = 'Consistent [practice] is the foundation of mastering any foreign [language].'; 
      newBlock.distractors = ['barrier', 'hesitation']; 
    }
    else if (type === 'matching') { 
      newBlock.instruction = 'Соедините слова и их значения:'; 
      newBlock.pairs = [
        { left: 'Key Concept', right: 'Основное понятие (main idea)' },
        { left: 'To cultivate', right: 'Развивать (develop over time)' },
        { left: 'Perspective', right: 'Точка зрения (viewpoint)' }
      ]; 
    }
    else if (type === 'sentence_reorder') { 
      newBlock.instruction = 'Соберите предложения из слов:'; 
      newBlock.sentences = [
        'Consistent daily practice is the key to speaking fluently.',
        'She had never encountered such a challenging problem before.',
        'They decided to explore different perspectives on this issue.'
      ]; 
      newBlock.sentence = newBlock.sentences[0];
    }
    else if (type === 'categorization') { 
      newBlock.instruction = 'Распределите слова по категориям:'; 
      newBlock.categories = ['Формальный стиль', 'Разговорный стиль']; 
      newBlock.items = [
        { id: 'it-1', text: 'Furthermore', categoryIndex: 0 }, 
        { id: 'it-2', text: 'Catch you later', categoryIndex: 1 }
      ]; 
    }
    else if (type === 'open_input') { 
      newBlock.prompt = '💬 Вопрос для обсуждения:\n1. Что вы думаете по этой теме?\n2. Приведите пример из своего опыта.'; 
    }

    return newBlock;
  };

  const handleInsertBlockAt = (targetIdx, rawType = 'text') => {
    const newBlock = createDefaultBlock(rawType);
    const updatedPages = [...(lesson.pages || [])];
    if (!updatedPages[activePageIndex]) {
      updatedPages[activePageIndex] = { id: 'p1', title: 'Часть 1', blocks: [] };
    }
    updatedPages[activePageIndex].blocks.splice(targetIdx, 0, newBlock);
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleAddBlock = (rawType) => {
    handleInsertBlockAt(activePage.blocks?.length || 0, rawType);
  };

  // Universal Drop Handler (Handles BOTH Palette blocks and Card reordering)
  const handleUniversalDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverTarget(null);

    // 1. Check if dropped from Left Palette
    const paletteData = e.dataTransfer.getData('new-block-type') || e.dataTransfer.getData('text/plain');
    if (paletteData && paletteData.startsWith('palette:')) {
      const cleanType = paletteData.replace('palette:', '').trim();
      handleInsertBlockAt(targetIdx, cleanType);
      return;
    }

    // 2. Reorder existing block
    if (draggedBlockIdx !== null && draggedBlockIdx !== targetIdx) {
      const blocks = [...(activePage.blocks || [])];
      const draggedItem = blocks[draggedBlockIdx];
      blocks.splice(draggedBlockIdx, 1);
      blocks.splice(targetIdx, 0, draggedItem);

      const updatedPages = [...(lesson.pages || [])];
      updatedPages[activePageIndex].blocks = blocks;
      updateLessonState(prev => ({ ...prev, pages: updatedPages }));
      setDraggedBlockIdx(null);
      setDraggableCardIdx(null);
    }
  };

  const handleUpdateBlock = (blockIdx, updatedBlock) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks[blockIdx] = updatedBlock;
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleMoveBlock = (blockIdx, direction) => {
    const blocks = [...(activePage.blocks || [])];
    const targetIdx = blockIdx + direction;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[blockIdx];
    blocks[blockIdx] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks = blocks;
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleDeleteBlock = (blockIdx) => {
    const updatedPages = [...(lesson.pages || [])];
    updatedPages[activePageIndex].blocks = updatedPages[activePageIndex].blocks.filter((_, i) => i !== blockIdx);
    updateLessonState(prev => ({ ...prev, pages: updatedPages }));
  };

  const handleOpenAiModal = (block, blockIdx) => {
    const normType = normalizeBlockType(block.type);
    setAiModalTarget({ block: { ...block, type: normType }, blockIdx });

    const isAnchor = normType === 'text' || normType === 'grammar_card' || normType === 'video' || normType === 'audio' || normType === 'link';
    if (isAnchor) {
      setSelectedSourceId(block.id);
    } else {
      const nearestSource = availableSourceBlocks[0];
      setSelectedSourceId(nearestSource ? nearestSource.id : '');
    }

    const isTrueFalseBlock = normType === 'multiple_choice' && Array.isArray(block.options) && 
      block.options.length === 2 && block.options.includes('True') && block.options.includes('False');

    if (isTrueFalseBlock) setSelectedTasks(['true_false']);
    else if (normType === 'grammar_card') setSelectedTasks(['grammar_quiz']);
    else if (normType === 'matching') setSelectedTasks(['matching']);
    else if (normType === 'flashcards') setSelectedTasks(['flashcards']);
    else if (normType === 'categorization') setSelectedTasks(['categorization']);
    else if (normType === 'spinning_wheel') setSelectedTasks(['spinning_wheel']);
    else if (normType === 'sentence_reorder') setSelectedTasks(['sentence_reorder']);
    else if (normType === 'inline_select') setSelectedTasks(['inline_select']);
    else setSelectedTasks(['listening']);
  };

  const toggleTaskSelection = (taskKey) => {
    setSelectedTasks(prev => prev.includes(taskKey) ? prev.filter(t => t !== taskKey) : [...prev, taskKey]);
  };

  const handleExecuteBlockAi = async (explicitActions) => {
    if (!aiModalTarget) return;
    const actionsToRun = Array.isArray(explicitActions) && explicitActions.length > 0 ? explicitActions : selectedTasks;

    if (actionsToRun.length === 0) return alert('Select at least one task');
    setAiGenerating(true);

    try {
      const res = await fetch('/api/ai/transform-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actions: actionsToRun,
          sourceBlock: aiModalTarget.block,
          sourceText: extractLessonContext(selectedSourceId || aiModalTarget.block.id),
          matchingType,
          flashcardType,
          level: modalLevel || lesson.level || 'B1'
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.newBlocks)) {
        const blocksWithIds = data.newBlocks.map((b, i) => ({ ...b, id: `ai-b-${Date.now()}-${i}` }));
        const updatedPages = [...(lesson.pages || [])];
        const currentBlocks = updatedPages[activePageIndex].blocks;

        const isSingleFill = actionsToRun.includes('fill_this_block') || actionsToRun.includes('expand_text') || actionsToRun.includes('shorten_text') || actionsToRun.includes('refine_level');

        if (isSingleFill && blocksWithIds.length > 0) {
          const filledBlock = {
            ...blocksWithIds[0],
            id: aiModalTarget.block.id,
            type: blocksWithIds[0].type || aiModalTarget.block.type
          };
          currentBlocks[aiModalTarget.blockIdx] = filledBlock;

          if (blocksWithIds.length > 1) {
            currentBlocks.splice(aiModalTarget.blockIdx + 1, 0, ...blocksWithIds.slice(1));
          }
        } else {
          const insertIdx = aiModalTarget.blockIdx + 1;
          currentBlocks.splice(insertIdx, 0, ...blocksWithIds);
        }

        updateLessonState(prev => ({ ...prev, pages: updatedPages }));
        setAiModalTarget(null);
      } else {
        alert('AI Transformation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error connecting to AI service');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      
      {/* 1. SLIM SINGLE-ROW STICKY HEADER */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-xs sticky top-16 z-30 transition">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* TITLE & ICON */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-base shadow-2xs shrink-0">
              🧩
            </div>
            <input
              type="text"
              value={lesson.title || ''}
              onChange={e => updateLessonState(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Название урока (Lesson Title)..."
              className="w-full font-extrabold text-sm sm:text-base text-slate-900 outline-none bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 px-2.5 py-1.5 rounded-xl transition border border-transparent focus:border-slate-200"
            />
          </div>

          {/* LEVEL, TOPIC & ACTIONS IN ONE COMPACT ROW */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            <select
              value={lesson.level || 'B1'}
              onChange={e => {
                const newLvl = e.target.value;
                updateLessonState(prev => ({ ...prev, level: newLvl }));
                setModalLevel(newLvl);
              }}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 hover:border-indigo-400 rounded-xl text-xs font-extrabold text-indigo-700 outline-none transition cursor-pointer"
              title="Уровень CEFR"
            >
              <option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option>
            </select>

            <input
              type="text"
              value={lesson.topic || ''}
              onChange={e => updateLessonState(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="Тема / Группа..."
              className="w-28 sm:w-36 px-2.5 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-xs font-semibold text-slate-800 outline-none transition"
            />

            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={() => onSaveLesson({ ...lesson, id: lesson.id || 'lesson-' + Date.now() })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. UNIFIED SINGLE-ROW TAB BAR */}
      <BuilderPagesBar
        pages={lesson.pages || []}
        activePageIndex={activePageIndex}
        setActivePageIndex={setActivePageIndex}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onUpdatePageTitle={handleUpdatePageTitle}
      />

      {/* 3. WORKSPACE CANVAS: PALETTE + BLOCKS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <BuilderPalette onAddBlock={handleAddBlock} />

        <div className="lg:col-span-3 space-y-3 min-w-0">
          {(activePage.blocks || []).length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOverTarget('empty-canvas'); }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleUniversalDrop(e, 0)}
              className={`bg-white p-10 rounded-3xl border-2 border-dashed transition-all text-center space-y-3 ${
                dragOverTarget === 'empty-canvas' ? 'border-indigo-500 bg-indigo-50/50 scale-101' : 'border-slate-200'
              }`}
            >
              <span className="text-3xl block">🧩</span>
              <p className="font-bold text-slate-600">На этой странице пока нет блоков.</p>
              <p className="text-slate-400 text-xs">
                Кликните любой блок из левой палитры Lego или перетащите его прямо сюда!
              </p>
            </div>
          ) : (
            (activePage.blocks || []).map((block, idx) => (
              <React.Fragment key={block.id || idx}>
                
                {/* INLINE HOVER INSERTION DIVIDER & QUICK MENU */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOverTarget(`divider-${idx}`); }}
                  onDragLeave={() => { if (dragOverTarget === `divider-${idx}`) setDragOverTarget(null); }}
                  onDrop={(e) => handleUniversalDrop(e, idx)}
                  className={`relative group/divider py-1 flex flex-col items-center justify-center transition-all ${
                    dragOverTarget === `divider-${idx}` ? 'py-3' : ''
                  }`}
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className={`w-full border-t transition-all ${
                      dragOverTarget === `divider-${idx}` 
                        ? 'border-indigo-500 border-2' 
                        : 'border-transparent group-hover/divider:border-indigo-300 border-dashed'
                    }`} />
                  </div>

                  {activeInsertMenuIdx === idx ? (
                    /* QUICK INSERT POPOVER TOOLBAR */
                    <div className="relative z-20 bg-white border-2 border-indigo-500 shadow-xl rounded-2xl p-2 flex flex-wrap gap-1.5 items-center justify-center max-w-xl animate-fade-in my-1">
                      <span className="text-[10px] font-extrabold text-indigo-900 uppercase px-2">Вставить:</span>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'text'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">📄 Текст</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'flashcards'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🎴 Флешкарты</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'multiple_choice'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">❓ Тест</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'image'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🖼️ Фото</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'audio'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🎧 Подкаст</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'matching'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🔗 Пары</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'gap_fill_bank'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🧩 Банк слов</button>
                      <button type="button" onClick={() => { handleInsertBlockAt(idx, 'sentence_reorder'); setActiveInsertMenuIdx(null); }} className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition">🔤 Сборка</button>
                      <button type="button" onClick={() => setActiveInsertMenuIdx(null)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600">✕</button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveInsertMenuIdx(idx)}
                      className="relative z-10 opacity-0 group-hover/divider:opacity-100 transition-all px-3 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-[10px] font-extrabold shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Вставить блок сюда</span>
                    </button>
                  )}
                </div>

                {/* LEGO BLOCK CARD (DRAGGABLE ONLY FROM THE ⣿ HANDLE) */}
                <div
                  draggable={draggableCardIdx === idx}
                  onDragStart={() => setDraggedBlockIdx(idx)}
                  onDragEnd={() => {
                    setDraggableCardIdx(null);
                    setDraggedBlockIdx(null);
                    setDragOverTarget(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTarget(`card-${idx}`);
                  }}
                  onDragLeave={() => {
                    if (dragOverTarget === `card-${idx}`) setDragOverTarget(null);
                  }}
                  onDrop={(e) => handleUniversalDrop(e, idx)}
                  className={`bg-white p-4 sm:p-6 rounded-3xl border transition-all duration-200 shadow-xs hover:shadow-md relative group ${
                    draggedBlockIdx === idx ? 'opacity-40 border-dashed border-indigo-500 scale-98' : 'border-slate-200/90 hover:border-indigo-300'
                  } ${dragOverTarget === `card-${idx}` ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                >
                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* DRAG HANDLE: DRAGGING IS ACTIVATED EXCLUSIVELY BY GRABBING HERE */}
                      <span
                        onMouseDown={() => setDraggableCardIdx(idx)}
                        onMouseUp={() => setDraggableCardIdx(null)}
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 font-bold px-1.5 py-0.5 rounded text-base select-none hover:bg-indigo-50 transition"
                        title="Потяните для изменения порядка карточек"
                      >
                        ⣿
                      </span>
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">#{idx + 1}</span>
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                        {normalizeBlockType(block?.type).replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAiModal(block, idx)}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-xl shadow-xs transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>✨ Generate / Fill with AI</span>
                      </button>
                      <button type="button" onClick={() => handleMoveBlock(idx, -1)} disabled={idx === 0} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer">▲</button>
                      <button type="button" onClick={() => handleMoveBlock(idx, 1)} disabled={idx === (activePage.blocks?.length || 1) - 1} className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer">▼</button>
                      <button type="button" onClick={() => handleDeleteBlock(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer" title="Удалить блок">🗑️</button>
                    </div>
                  </div>

                  {/* BLOCK EDITOR ROUTER (NORMAL TEXT SELECTION RESTORED!) */}
                  <EditableBlockCard
                    block={block}
                    onChange={updated => handleUpdateBlock(idx, updated)}
                    lesson={lesson}
                    pages={lesson.pages || []}
                    availableSourceBlocks={availableSourceBlocks}
                    extractLessonContext={extractLessonContext}
                    sourceText={extractLessonContext()}
                    lessonTitle={lesson.title || lesson.topic || ''}
                    level={lesson.level || 'B1'}
                  />
                </div>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      <BuilderAiModal
        aiModalTarget={aiModalTarget}
        availableSourceBlocks={availableSourceBlocks}
        selectedSourceId={selectedSourceId}
        setSelectedSourceId={setSelectedSourceId}
        selectedTasks={selectedTasks}
        toggleTaskSelection={toggleTaskSelection}
        matchingType={matchingType}
        setMatchingType={setMatchingType}
        flashcardType={flashcardType}
        setFlashcardType={setFlashcardType}
        modalLevel={modalLevel}
        setModalLevel={setModalLevel}
        onExecute={handleExecuteBlockAi}
        onClose={() => setAiModalTarget(null)}
        aiGenerating={aiGenerating}
      />
    </div>
  );
};
