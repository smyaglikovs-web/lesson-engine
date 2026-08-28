import React, { useRef } from 'react';
import { Button } from './ui/Button.jsx';
import { Card, CardContent } from './ui/Card.jsx';
import { Badge } from './ui/Badge.jsx';

export const LibraryView = ({ lessons, loading, onOpenLesson, onCreateNew, onDeleteLesson, onViewSubmissions, onEditLesson }) => {
  const fileInputRef = useRef(null);

  const handleExportLesson = async (lessonSummary, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/lessons/${lessonSummary.id}`);
      const fullLessonData = await res.json();
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullLessonData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${(lessonSummary.title || 'lesson').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Ошибка экспорта урока: ' + err.message);
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedJson = JSON.parse(event.target.result);
        if (!importedJson.title || !importedJson.pages) {
          throw new Error('Некорректная структура JSON урока (отсутствуют title или pages)');
        }

        const password = localStorage.getItem('teacher_pass') || 'teacher123';
        const newLesson = {
          ...importedJson,
          id: 'lesson-' + Date.now(),
          title: `${importedJson.title} (Импорт)`
        };

        const res = await fetch('/api/lessons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-teacher-password': password
          },
          body: JSON.stringify(newLesson)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          alert('🎉 Урок успешно импортирован в библиотеку!');
          window.location.reload();
        } else {
          alert('Ошибка сохранения импортированного урока: ' + (data.error || 'Ошибка доступа'));
        }
      } catch (err) {
        alert('Ошибка чтения файла: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Облачная библиотека уроков</h2>
          <p className="text-slate-500 text-sm mt-1">Управление интерактивными уроками и результатами учеников</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} title="Загрузить урок из JSON файла">
            📥 Импорт JSON
          </Button>
          <Button variant="primary" onClick={onCreateNew}>
            + Создать урок
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-medium">Загрузка из Cloudflare D1...</div>
      ) : lessons.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <span className="text-4xl mb-2 block">📚</span>
            <p className="text-slate-500 font-bold">Пока нет уроков в библиотеке.</p>
            <p className="text-slate-400 text-xs mt-1">Нажмите "+ Создать урок" или импортируйте готовый JSON!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map(l => (
            <Card key={l.id} interactive className="flex flex-col justify-between">
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge variant="brand">{l.level || 'A2-B1'}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={(e) => handleExportLesson(l, e)} title="Экспортировать урок в JSON">
                      💾 Экспорт
                    </Button>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEditLesson(l); }} title="Редактировать урок">
                      ✏️ Редактировать
                    </Button>
                    <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onViewSubmissions(l); }}>
                      📊 ДЗ
                    </Button>
                    <Button variant="danger" size="sm" onClick={(e) => onDeleteLesson(l.id, e)} title="Удалить урок">
                      🗑️
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">{l.title}</h3>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">{l.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <Button variant="success" onClick={() => onOpenLesson(l.id)}>
                    Провести урок
                  </Button>
                  <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?homework=${l.id}`); alert('🔗 Ссылка на домашнее задание скопирована!'); }}>
                    Ссылка на ДЗ 🏠
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
