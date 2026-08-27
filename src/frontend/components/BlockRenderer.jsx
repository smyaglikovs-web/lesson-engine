import React from 'react';
import { BlockHeading, BlockText, BlockImage, BlockVideo, BlockAudio, BlockGrammarCard } from './BlockMedia.jsx';
import { BlockMultipleChoice } from './BlockMultipleChoice.jsx';
import { BlockMatching } from './BlockMatching.jsx';
import { BlockGapFill } from './BlockGapFill.jsx';
import { BlockGapFillBank } from './BlockGapFillBank.jsx';
import { BlockOpenInput } from './BlockOpenInput.jsx';
import { BlockFlashcards } from './BlockFlashcards.jsx';
import { BlockReorder } from './BlockReorder.jsx';
import { BlockCategorization } from './BlockCategorization.jsx';
import { BlockInlineSelect } from './BlockInlineSelect.jsx';
import { BlockTeacherNotes } from './BlockTeacherNotes.jsx';
import { BlockSpinningWheel } from './BlockSpinningWheel.jsx';

export const BlockRenderer = ({ block, value, onChange, isTeacher, onEditMedia }) => {
  if (!block || typeof block !== 'object') return null;

  let rawType = String(block.type || 'text').toLowerCase().trim();

  // Auto-map loose naming to canonical engine block types
  if (rawType === 'header' || rawType === 'title' || rawType === 'h1' || rawType === 'h2' || rawType === 'h3') rawType = 'heading';
  if (rawType === 'paragraph' || rawType === 'reading' || rawType === 'article' || rawType === 'content' || rawType === 'story') rawType = 'text';
  if (rawType === 'quiz' || rawType === 'question' || rawType === 'true_false' || rawType === 'mc' || rawType === 'multiple-choice') rawType = 'multiple_choice';
  if (rawType === 'vocab' || rawType === 'words' || rawType === 'flashcard' || rawType === 'cards') rawType = 'flashcards';
  if (rawType === 'prompt' || rawType === 'speaking' || rawType === 'discussion' || rawType === 'question_input') rawType = 'open_input';
  if (rawType === 'rule' || rawType === 'grammar' || rawType === 'grammar-card' || rawType === 'grammarcard') rawType = 'grammar_card';
  if (rawType === 'gapfill' || rawType === 'gap-fill' || rawType === 'fill_gap') rawType = 'gap_fill';
  if (rawType === 'gapfill_bank' || rawType === 'gap-fill-bank' || rawType === 'word_bank' || rawType === 'wordbank') rawType = 'gap_fill_bank';
  if (rawType === 'reorder' || rawType === 'reorder_sentence' || rawType === 'sentence-reorder') rawType = 'sentence_reorder';
  if (rawType === 'categories' || rawType === 'bucket') rawType = 'categorization';
  if (rawType === 'inline_select' || rawType === 'inline-select' || rawType === 'dropdown_select' || rawType === 'select_gap') rawType = 'inline_select';
  if (rawType === 'teacher_notes' || rawType === 'teacher-notes' || rawType === 'notes') rawType = 'teacher_notes';
  if (rawType === 'spinning_wheel' || rawType === 'wheel' || rawType === 'roulette') rawType = 'spinning_wheel';

  const normalizedBlock = { ...block, type: rawType };

  switch (rawType) {
    case 'heading': 
      return <BlockHeading block={normalizedBlock} />;
    case 'text': 
      return <BlockText block={normalizedBlock} />;
    case 'image': 
      return <BlockImage block={normalizedBlock} onEditMedia={onEditMedia} />;
    case 'video': 
      return <BlockVideo block={normalizedBlock} onEditMedia={onEditMedia} />;
    case 'audio': 
      return <BlockAudio block={normalizedBlock} onEditMedia={onEditMedia} />;
    case 'grammar_card': 
      return <BlockGrammarCard block={normalizedBlock} />;
    case 'flashcards': 
      return <BlockFlashcards block={normalizedBlock} />;
    case 'multiple_choice': 
      return <BlockMultipleChoice block={normalizedBlock} value={value} onChange={onChange} />;
    case 'gap_fill': 
      return <BlockGapFill block={normalizedBlock} value={value} onChange={onChange} />;
    case 'gap_fill_bank': 
      return <BlockGapFillBank block={normalizedBlock} value={value} onChange={onChange} />;
    case 'inline_select':
      return <BlockInlineSelect block={normalizedBlock} value={value} onChange={onChange} />;
    case 'matching': 
      return <BlockMatching block={normalizedBlock} value={value} onChange={onChange} />;
    case 'sentence_reorder': 
      return <BlockReorder block={normalizedBlock} value={value} onChange={onChange} />;
    case 'categorization': 
      return <BlockCategorization block={normalizedBlock} value={value} onChange={onChange} />;
    case 'spinning_wheel':
      return <BlockSpinningWheel block={normalizedBlock} value={value} onChange={onChange} />;
    case 'teacher_notes':
      return <BlockTeacherNotes block={normalizedBlock} isTeacher={isTeacher} />;
    case 'open_input': 
      return <BlockOpenInput block={normalizedBlock} value={value} onChange={onChange} />;
    default: 
      return <BlockText block={{ ...normalizedBlock, text: block.text || block.content || block.title || block.prompt || JSON.stringify(block) }} />;
  }
};
