let taskId = 0;
let columnId = 0;

window.onload = function() {
    loadState();
    if (document.querySelector('.board').children.length === 0) {
        addColumn();
    }
};

// Função para criar uma tarefa
function createTask(taskText) {
    const task = document.createElement('div');
    task.className = 'task';
    task.id = 'task-' + taskId++;
    task.draggable = true;
    task.addEventListener('dragstart', drag);

    const taskHeader = document.createElement('div');
    taskHeader.className = 'task-header';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = function() {
        task.classList.toggle('completed');
        saveState();
    };

    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';

    const taskLabel = document.createElement('span');
    taskLabel.textContent = taskText;
    taskLabel.onclick = function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nova Tarefa';
        input.value = taskLabel.textContent === 'Nova Tarefa' ? '' : taskLabel.textContent;
        input.onblur = function() {
            taskLabel.textContent = input.value.trim() || 'Nova Tarefa';
            taskContent.replaceChild(taskLabel, input);
            saveState();
        };
        input.onkeypress = function(e) {
            if (e.key === 'Enter') input.blur();
        };
        taskContent.replaceChild(input, taskLabel);
        input.focus();
    };

    taskContent.appendChild(taskLabel);

    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';

    const addSubtaskButton = document.createElement('button');
    addSubtaskButton.textContent = '+';
    addSubtaskButton.className = 'add-subtask';
    addSubtaskButton.onclick = function() {
        const subtask = createSubtask('Nova Subtarefa');
        task.querySelector('.subtask-list').appendChild(subtask);
        saveState();
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.className = 'delete';
    deleteButton.onclick = function() {
        task.remove();
        saveState();
    };

    taskActions.appendChild(addSubtaskButton);
    taskActions.appendChild(deleteButton);

    const subtaskList = document.createElement('div');
    subtaskList.className = 'subtask-list';

    taskHeader.appendChild(checkbox);
    taskHeader.appendChild(taskContent);
    taskHeader.appendChild(taskActions);

    task.appendChild(taskHeader);
    task.appendChild(subtaskList);

    return task;
}

// Função para criar uma subtarefa
function createSubtask(subtaskText) {
    const subtask = document.createElement('div');
    subtask.className = 'subtask';
    subtask.id = 'subtask-' + taskId++;
    subtask.draggable = true;
    subtask.addEventListener('dragstart', drag);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = function() {
        subtask.classList.toggle('completed');
        saveState();
    };

    const subtaskLabel = document.createElement('span');
    subtaskLabel.textContent = subtaskText;
    subtaskLabel.onclick = function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nova Subtarefa';
        input.value = subtaskLabel.textContent === 'Nova Subtarefa' ? '' : subtaskLabel.textContent;
        input.onblur = function() {
            subtaskLabel.textContent = input.value.trim() || 'Nova Subtarefa';
            subtask.replaceChild(subtaskLabel, input);
            saveState();
        };
        input.onkeypress = function(e) {
            if (e.key === 'Enter') input.blur();
        };
        subtask.replaceChild(input, subtaskLabel);
        input.focus();
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.className = 'delete';
    deleteButton.onclick = function() {
        subtask.remove();
        saveState();
    };

    subtask.appendChild(checkbox);
    subtask.appendChild(subtaskLabel);
    subtask.appendChild(deleteButton);

    return subtask;
}

// Adicionar uma nova coluna
function addColumn() {
    const column = document.createElement('div');
    column.className = 'column';
    const currentColumnId = columnId;
    column.id = 'column-' + currentColumnId;
    column.addEventListener('dragover', allowDrop);
    column.addEventListener('drop', drop);
    column.addEventListener('dragenter', dragEnter);
    column.addEventListener('dragleave', dragLeave);

    const header = document.createElement('h2');
    const title = document.createElement('span');
    title.textContent = 'Nova Coluna';
    title.onclick = function() {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nova Coluna';
        input.value = title.textContent === 'Nova Coluna' ? '' : title.textContent;
        input.onblur = function() {
            title.textContent = input.value.trim() || 'Nova Coluna';
            header.replaceChild(title, input);
            saveState();
        };
        input.onkeypress = function(e) {
            if (e.key === 'Enter') input.blur();
        };
        header.replaceChild(input, title);
        input.focus();
    };

    const addTaskButton = document.createElement('button');
    addTaskButton.textContent = '+';
    addTaskButton.className = 'add-column-task';
    addTaskButton.onclick = function() {
        const task = createTask('Nova Tarefa');
        document.getElementById('task-list-' + currentColumnId).appendChild(task);
        saveState();
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.className = 'delete-column';
    deleteButton.onclick = function() {
        column.remove();
        saveState();
    };

    const colorPicker = document.getElementById('colorPicker');
    title.ondblclick = function() {
        colorPicker.onchange = function() {
            column.style.backgroundColor = colorPicker.value;
            saveState();
        };
        colorPicker.click();
    };

    header.appendChild(title);
    header.appendChild(addTaskButton);
    header.appendChild(deleteButton);

    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    taskList.id = 'task-list-' + currentColumnId;

    column.appendChild(header);
    column.appendChild(taskList);

    const hue = Math.floor(Math.random() * 360);
    column.style.backgroundColor = `hsl(${hue}, 80%, 98%)`;

    document.querySelector('.board').appendChild(column);
    columnId++;
    saveState();
}

// Exportar estado
function exportState() {
    const state = localStorage.getItem('taskManagerState');
    const blob = new Blob([state], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task-manager-state.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Importar estado
function importState(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('taskManagerState', e.target.result);
            loadState();
        };
        reader.readAsText(file);
    }
}

// Salvar estado no localStorage
function saveState() {
    const board = document.querySelector('.board');
    const columns = Array.from(board.children).map(column => ({
        id: column.id,
        title: column.querySelector('h2 span').textContent,
        backgroundColor: column.style.backgroundColor,
        tasks: Array.from(column.querySelectorAll('.task')).map(task => ({
            id: task.id,
            text: task.querySelector('.task-content span').textContent,
            completed: task.classList.contains('completed'),
            subtasks: Array.from(task.querySelectorAll('.subtask')).map(subtask => ({
                id: subtask.id,
                text: subtask.querySelector('span').textContent,
                completed: subtask.classList.contains('completed')
            }))
        }))
    }));

    const state = {
        columns,
        taskId,
        columnId
    };

    localStorage.setItem('taskManagerState', JSON.stringify(state));
}

// Carregar estado do localStorage
function loadState() {
    const state = JSON.parse(localStorage.getItem('taskManagerState'));
    if (!state) return;

    taskId = state.taskId || 0;
    columnId = state.columnId || 0;

    const board = document.querySelector('.board');
    board.innerHTML = '';

    state.columns.forEach(col => {
        const column = document.createElement('div');
        column.className = 'column';
        column.id = col.id;
        column.addEventListener('dragover', allowDrop);
        column.addEventListener('drop', drop);
        column.addEventListener('dragenter', dragEnter);
        column.addEventListener('dragleave', dragLeave);
        column.style.backgroundColor = col.backgroundColor;

        const header = document.createElement('h2');
        const title = document.createElement('span');
        title.textContent = col.title;
        title.onclick = function() {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Nova Coluna';
            input.value = title.textContent === 'Nova Coluna' ? '' : title.textContent;
            input.onblur = function() {
                title.textContent = input.value.trim() || 'Nova Coluna';
                header.replaceChild(title, input);
                saveState();
            };
            input.onkeypress = function(e) {
                if (e.key === 'Enter') input.blur();
            };
            header.replaceChild(input, title);
            input.focus();
        };

        const addTaskButton = document.createElement('button');
        addTaskButton.textContent = '+';
        addTaskButton.className = 'add-column-task';
        addTaskButton.onclick = function() {
            const task = createTask('Nova Tarefa');
            document.getElementById(col.id.replace('column-', 'task-list-')).appendChild(task);
            saveState();
        };

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.className = 'delete-column';
        deleteButton.onclick = function() {
            column.remove();
            saveState();
        };

        const colorPicker = document.getElementById('colorPicker');
        title.ondblclick = function() {
            colorPicker.onchange = function() {
                column.style.backgroundColor = colorPicker.value;
                saveState();
            };
            colorPicker.click();
        };

        header.appendChild(title);
        header.appendChild(addTaskButton);
        header.appendChild(deleteButton);

        const taskList = document.createElement('div');
        taskList.className = 'task-list';
        taskList.id = col.id.replace('column-', 'task-list-');

        col.tasks.forEach(taskData => {
            const task = createTask(taskData.text);
            if (taskData.completed) task.classList.add('completed');
            task.id = taskData.id;
            taskData.subtasks.forEach(subtaskData => {
                const subtask = createSubtask(subtaskData.text);
                if (subtaskData.completed) subtask.classList.add('completed');
                subtask.id = subtaskData.id;
                task.querySelector('.subtask-list').appendChild(subtask);
            });
            taskList.appendChild(task);
        });

        column.appendChild(header);
        column.appendChild(taskList);
        board.appendChild(column);
    });
}

// Permitir que o elemento seja solto
function allowDrop(event) {
    event.preventDefault();
    console.log('Drag over:', event.target.className);
}

// Iniciar o arrastar
function drag(event) {
    event.dataTransfer.setData('text', event.target.id);
    console.log('Dragging:', event.target.id, event.target.className);
}

// Feedback ao entrar na área de drop
function dragEnter(event) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text');
    const draggedElement = document.getElementById(draggedId);
    const column = event.currentTarget;

    if (!draggedElement || !column) {
        console.log('No dragged element or column');
        return;
    }

    const isTask = draggedElement.className === 'task';
    const overSubtaskList = event.target.closest('.subtask-list') !== null;

    console.log('Drag enter:', {
        dragged: draggedElement.className,
        overSubtaskList: overSubtaskList,
        columnId: column.id
    });

    if (isTask && overSubtaskList) {
        column.classList.add('drag-reject');
        column.classList.remove('drag-accept');
    } else {
        column.classList.add('drag-accept');
        column.classList.remove('drag-reject');
    }
}

// Remover feedback ao sair da área de drop
function dragLeave(event) {
    const column = event.currentTarget;
    if (column) {
        console.log('Drag leave:', column.id);
        column.classList.remove('drag-accept');
        column.classList.remove('drag-reject');
    }
}

// Soltar o elemento
function drop(event) {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text');
    const draggedElement = document.getElementById(draggedId);
    const column = event.currentTarget;
    const targetTaskList = event.target.closest('.task-list');
    const targetSubtaskList = event.target.closest('.subtask-list');

    if (!draggedElement || !column) {
        console.log('Drop failed: No dragged element or column');
        return;
    }

    console.log('Drop:', {
        dragged: draggedElement.className,
        targetTaskList: !!targetTaskList,
        targetSubtaskList: !!targetSubtaskList
    });

    // Limpar feedback visual
    column.classList.remove('drag-accept');
    column.classList.remove('drag-reject');

    // Impedir que uma tarefa seja movida para uma subtask-list
    if (draggedElement.className === 'task' && targetSubtaskList) {
        console.log('Task drop rejected on subtask-list');
        return;
    }

    // Permitir que uma subtarefa seja movida para outra tarefa
    if (draggedElement.className === 'subtask' && targetSubtaskList) {
        targetSubtaskList.appendChild(draggedElement);
    } else if (draggedElement.className === 'subtask' && targetTaskList) {
        const targetTask = event.target.closest('.task');
        if (targetTask) {
            const subtaskList = targetTask.querySelector('.subtask-list');
            subtaskList.appendChild(draggedElement);
        } else {
            const newTask = createTask(draggedElement.querySelector('span').textContent);
            targetTaskList.appendChild(newTask);
            draggedElement.remove();
        }
    } else if (draggedElement.className === 'task' && targetTaskList) {
        targetTaskList.appendChild(draggedElement);
    }

    saveState();
}