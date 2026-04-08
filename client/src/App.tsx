import Sidebar from './components/Sidebar';
import TaskList from './components/TaskList';
import UndoToast from './components/UndoToast';
import { useAppState } from './hooks/useAppState';

export default function App() {
  const s = useAppState();

  return (
    <>
      {s.error && (
        <div className="error-toast">{s.error}</div>
      )}
      {s.undo && <UndoToast message={s.undo.message} onUndo={s.undo.action} onDismiss={s.dismissUndo} />}
      <Sidebar lists={s.lists} activeListId={s.activeListId} viewMode={s.viewMode}
        onSelectList={s.setActiveListId} onSelectView={s.setViewMode}
        onAdd={s.addList} onRename={s.renameList} onDelete={s.deleteList} taskCounts={s.taskCounts}
        theme={s.theme} onToggleTheme={s.toggleTheme} onImported={s.handleImported} />
      <TaskList listName={s.listName} tasks={s.tasks} allTasks={s.tasks} loading={s.loading}
        sort={s.sort} search={s.search} viewMode={s.viewMode} emptyMessage={s.emptyMessage}
        onSortChange={s.setSort} onSearchChange={s.setSearch}
        onAddTask={s.addTask} onToggle={s.handleToggle} onStar={s.toggleStar}
        onDelete={s.handleDelete} onUpdate={s.updateTask} onInlineEdit={s.handleInlineEdit}
        onReorder={s.reorderTask} onAddSubtask={s.addSubtask}
        onBatchComplete={s.handleBatchComplete} onBatchDelete={s.handleBatchDelete} />
    </>
  );
}
