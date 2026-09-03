import React from 'react';
import { 
  BlockHeading, 
  BlockText, 
  BlockImage, 
  BlockVideo, 
  BlockAudio, 
  BlockGrammarCard 
} from './BlockMedia.jsx';
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
import { BlockLink } from './BlockLink.jsx';

export const normalizeBlockType = (rawType = '') => {
  let t = String(rawType || 'text').toLowerCase().trim();
  
  if (t === 'header' || t === 'title' || t === 'h1' || t === 'h2' || t === 'h3') return 'heading';
  if (t === 'paragraph' || t === 'reading' || t === 'article' || t === 'content' || t === 'story' || t === 'reading_comprehension' || t === 'reading comprehension') return 'text';
  if (t === 'quiz' || t === 'question' || t === 'true_false' || t === 'mc' || t === 'multiple-choice' || t === 'error-analysis' || t === 'error_analysis') return 'multiple_choice';
  if (t === 'vocab' || t === 'words' || t === 'flashcard' || t === 'cards' || t === 'vocabulary_building' || t === 'vocabulary building') return 'flashcards';
  if (t === 'prompt' || t === 'speaking' || t === 'discussion' || t === 'question_input' || t === 'writing') return 'open_input';
  if (t === 'rule' || t === 'grammar' || t === 'grammar-card' || t === 'grammarcard' || t === 'grammar_focus' || t === 'grammar focus') return 'grammar_card';
  if (t === 'gapfill' || t === 'gap-fill' || t === 'fill_gap' || t === 'fill-in-the-blank' || t === 'fill_in_the_blank') return 'gap_fill';
  if (t === 'gapfill_bank' || t === 'gap-fill-bank' || t === 'word_bank' || t === 'wordbank' || t === 'drag-and-drop' || t === 'drag_and_drop') return 'gap_fill_bank';
  if (t === 'reorder' || t === 'reorder_sentence' || t === 'sentence-reorder' || t === 'unscramble' || t === 'sentence-construction' || t === 'sentence_construction') return 'sentence_reorder';
  if (t === 'categories' || t === 'bucket' || t === 'sorting' || t === 'category') return 'categorization';
  if (t === 'inline' || t === 'inline_select' || t === 'dropdown_select' || t === 'select_gap' || t === 'drop_down' || t === 'inline-select') return 'inline_select';
  if (t === 'teacher_notes' || t === 'teacher-notes' || t === 'notes') return 'teacher_notes';
  if (t === 'spinning_wheel' || t === 'wheel' || t === 'roulette' || t === 'speaking_wheel' || t === 'spinning-wheel') return 'spinning_wheel';
  if (t === 'url' || t === 'link' || t === 'website' || t === 'web_link' || t === 'embed') return 'link';

  return t;
};

export const BlockRenderer = ({ block, value, onChange, isTeacher, onEditMedia }) => {
  if (!block || typeof block !== 'object') return null;

  const normalizedType = normalizeBlockType(block.type);
  const normalizedBlock = { ...block, type: normalizedType };

  switch (normalizedType) {
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
    case 'link':
      return <BlockLink block={normalizedBlock} />;
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
