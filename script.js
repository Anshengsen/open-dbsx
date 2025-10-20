document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('new-todo');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterButtons = document.querySelectorAll('.filter-buttons button');
    const clearCompletedButton = document.getElementById('clear-completed');
    const emptyMessage = document.getElementById('empty-message');
    
    const exportButton = document.getElementById('export-data');
    const importButton = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');

    const LOCAL_STORAGE_KEY = 'advancedPureStaticTodos';
    let currentFilter = 'all';

    function loadTodos() {
        const storedTodos = localStorage.getItem(LOCAL_STORAGE_KEY);
        try {
            return storedTodos ? JSON.parse(storedTodos) : [];
        } catch (e) {
            console.error("无法解析本地存储数据:", e);
            return [];
        }
    }

    function saveTodos(todos) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todos));
    }

    function renderTodos(allTodos) {
        const filteredTodos = allTodos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        todoList.innerHTML = '';
        emptyMessage.style.display = allTodos.length === 0 ? 'block' : 'none';

        filteredTodos.forEach(todo => {
            const listItem = document.createElement('li');
            listItem.classList.toggle('completed', todo.completed);
            
            const todoContent = document.createElement('div');
            todoContent.classList.add('todo-content');

            const checkboxLabel = document.createElement('label');
            checkboxLabel.classList.add('checkbox-label');
            
            const checkboxInput = document.createElement('input');
            checkboxInput.type = 'checkbox';
            checkboxInput.checked = todo.completed;
            checkboxInput.addEventListener('change', () => toggleTodo(todo.id));
            
            const checkmark = document.createElement('span');
            checkmark.classList.add('checkmark');
            
            checkboxLabel.appendChild(checkboxInput);
            checkboxLabel.appendChild(checkmark);
            
            const textSpan = document.createElement('span');
            textSpan.textContent = todo.text;
            textSpan.classList.add('todo-text');
            textSpan.addEventListener('dblclick', (e) => {
                if (!checkboxInput.checked) {
                     startEdit(listItem, todo.id, todo.text);
                }
            }); 
            
            todoContent.appendChild(checkboxLabel);
            todoContent.appendChild(textSpan);
            
            const todoActions = document.createElement('div');
            todoActions.classList.add('todo-actions');

            const editButton = document.createElement('button');
            editButton.textContent = '编辑';
            editButton.classList.add('action-button', 'edit-button');
            editButton.addEventListener('click', () => {
                if (!checkboxInput.checked) {
                    startEdit(listItem, todo.id, todo.text);
                } else {
                    alert('请先取消完成状态再编辑。');
                }
            });
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.classList.add('action-button', 'delete-button');
            deleteButton.addEventListener('click', () => deleteTodo(todo.id));
            
            todoActions.appendChild(editButton);
            todoActions.appendChild(deleteButton);
            
            listItem.appendChild(todoContent);
            listItem.appendChild(todoActions);
            todoList.appendChild(listItem);
        });
    }

    function startEdit(listItem, id, currentText) {
        const textSpan = listItem.querySelector('.todo-text');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'edit-input';
        input.style.cssText = 'padding: 5px; border: 1px solid #ccc; border-radius: 3px; margin-left: 10px; width: 80%;';
        
        textSpan.style.display = 'none';
        listItem.querySelector('.todo-content').insertBefore(input, textSpan);
        input.focus();

        const finishEdit = () => {
            const newText = input.value.trim();
            
            if (newText && newText !== currentText) {
                editTodo(id, newText);
            } else {
                renderTodos(loadTodos()); 
            }
            
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
            textSpan.style.display = 'block';
        };
        
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.removeEventListener('blur', finishEdit);
                finishEdit();
            }
        });
    }

    function addTodo() {
        const text = todoInput.value.trim();
        if (text === '') {
            return;
        }

        const todos = loadTodos();
        const newTodo = { 
            id: Date.now().toString(),
            text: text, 
            completed: false 
        };
        todos.unshift(newTodo);

        saveTodos(todos);
        renderTodos(todos);
        todoInput.value = '';
        todoInput.focus();
    }

    function deleteTodo(id) {
        let todos = loadTodos();
        todos = todos.filter(todo => todo.id !== id);
        saveTodos(todos);
        renderTodos(todos);
    }

    function toggleTodo(id) {
        let todos = loadTodos();
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveTodos(todos);
            renderTodos(todos);
        }
    }

    function editTodo(id, newText) {
        let todos = loadTodos();
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            saveTodos(todos);
            renderTodos(todos);
        }
    }
    
    function setFilter(filter) {
        currentFilter = filter;
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        renderTodos(loadTodos());
    }

    function clearCompleted() {
        let todos = loadTodos();
        todos = todos.filter(todo => !todo.completed);
        saveTodos(todos);
        renderTodos(todos);
    }
    
    function exportData() {
        const todos = loadTodos();
        const dataStr = JSON.stringify(todos, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`成功导出 ${todos.length} 条待办事项！`);
    }

    function importData(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTodos = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedTodos)) {
                    throw new Error("文件内容不是有效的待办事项数组格式。");
                }
                
                saveTodos(importedTodos);
                renderTodos(importedTodos);
                alert(`成功导入 ${importedTodos.length} 条待办事项！数据已恢复。`);
                
            } catch (error) {
                alert(`导入失败：${error.message}`);
                console.error("导入失败:", error);
            }
        };
        reader.readAsText(file);
    }

    addButton.addEventListener('click', addTodo);
    
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            setFilter(button.dataset.filter);
        });
    });

    clearCompletedButton.addEventListener('click', clearCompleted);
    
    exportButton.addEventListener('click', exportData);
    
    importButton.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', importData);

    renderTodos(loadTodos());
});