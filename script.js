let taskId = 0;
let columnId = 0;
let folders = [];
let nextFolderId = 1;
let nextColumnId = 1;
let nextTaskId = 1;
let draggedItem = null;
let draggedItemType = null;
let currentColorTarget = null;

// Variáveis para controle de ordenação
let currentSortField = null;
let currentSortDirection = null;

// Variáveis para o Timer Pomodoro
let pomodoroTimer = null;
let pomodoroMinutes = 25;
let pomodoroSeconds = 0;
let pomodoroMode = 'focus'; // 'focus', 'break', 'longBreak'
let pomodoroRunning = false;
let pomodoroCycles = 0;
let totalFocusTime = 0;
let pomodoroSettings = {
    focusTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    cyclesBeforeLongBreak: 4
};

// Variáveis para o Modo de Foco
let focusModeActive = false;
let focusedElementId = null;
let focusedElementType = null; // 'folder' ou 'column'

// Temas predefinidos
const predefinedThemes = {
    default: {
        name: 'Padrão',
        colors: {
            primaryColor: '#4a6bff',
            secondaryColor: '#ff6b6b',
            accentColor: '#ffbe0b',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#f8f9fa',
            cardBg: '#ffffff',
            textColor: '#333333',
            textSecondary: '#666666',
            borderColor: '#333333',
            borderLight: '#dddddd'
        }
    },
    dark: {
        name: 'Escuro',
        colors: {
            primaryColor: '#7289da',
            secondaryColor: '#ff6b6b',
            accentColor: '#ffbe0b',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#1a1a2e',
            cardBg: '#2a2a3e',
            textColor: '#e6e6e6',
            textSecondary: '#b0b0b0',
            borderColor: '#4a4a6a',
            borderLight: '#3a3a4a'
        }
    },
    blue: {
        name: 'Azul Sereno',
        colors: {
            primaryColor: '#0066cc',
            secondaryColor: '#ff6b6b',
            accentColor: '#ffbe0b',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#e6f2ff',
            cardBg: '#ffffff',
            textColor: '#333333',
            textSecondary: '#666666',
            borderColor: '#0066cc',
            borderLight: '#cce0ff'
        }
    },
    green: {
        name: 'Verde Natureza',
        colors: {
            primaryColor: '#00994d',
            secondaryColor: '#ff6b6b',
            accentColor: '#ffbe0b',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#e6fff2',
            cardBg: '#ffffff',
            textColor: '#333333',
            textSecondary: '#666666',
            borderColor: '#00994d',
            borderLight: '#ccffe6'
        }
    },
    purple: {
        name: 'Roxo Místico',
        colors: {
            primaryColor: '#6600cc',
            secondaryColor: '#ff6b6b',
            accentColor: '#ffbe0b',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#f2e6ff',
            cardBg: '#ffffff',
            textColor: '#333333',
            textSecondary: '#666666',
            borderColor: '#6600cc',
            borderLight: '#e6ccff'
        }
    },
    sunset: {
        name: 'Pôr do Sol',
        colors: {
            primaryColor: '#ff6600',
            secondaryColor: '#ff3366',
            accentColor: '#ffcc00',
            successColor: '#3cb371',
            warningColor: '#ff9800',
            bgColor: '#fff1e6',
            cardBg: '#ffffff',
            textColor: '#333333',
            textSecondary: '#666666',
            borderColor: '#ff6600',
            borderLight: '#ffccb3'
        }
    }
};

// Tema atual
let currentTheme = 'default';
let customTheme = null;

window.onload = function() {
    loadState();
    loadThemePreference();
    loadViewPreference();
    loadSortPreference();
    renderFolders();
    updateTaskCounters();
    loadFocusModeState();
    
    // Se não houver pastas, criar uma pasta padrão
    if (folders.length === 0) {
        addFolder();
    }
};

// Função para criar uma tarefa
function createTask(taskText, dueDate = '', label = '') {
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
        checkDueDates();
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

    const dueDateElement = document.createElement('div');
    dueDateElement.className = 'due-date';
    if (dueDate) {
        dueDateElement.textContent = `Vence: ${new Date(dueDate).toLocaleDateString('pt-BR')}`;
        if (new Date(dueDate) < new Date() && !task.classList.contains('completed')) {
            task.classList.add('overdue');
        }
    }
    dueDateElement.onclick = function() {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = dueDate || '';
        input.onblur = function() {
            dueDate = input.value;
            dueDateElement.textContent = dueDate ? `Vence: ${new Date(dueDate).toLocaleDateString('pt-BR')}` : '';
            task.classList.toggle('overdue', dueDate && new Date(dueDate) < new Date() && !task.classList.contains('completed'));
            taskContent.replaceChild(dueDateElement, input);
            saveState();
        };
        input.onkeypress = function(e) {
            if (e.key === 'Enter') input.blur();
        };
        taskContent.replaceChild(input, dueDateElement);
        input.focus();
    };

    const labelsElement = document.createElement('div');
    labelsElement.className = 'labels';
    if (label) {
        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        labelSpan.className = label.toLowerCase();
        labelsElement.appendChild(labelSpan);
    }
    labelsElement.onclick = function() {
        const select = document.createElement('select');
        const options = ['', 'Urgente', 'Trabalho', 'Pessoal', 'Outro'];
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.toLowerCase();
            option.textContent = opt || 'Sem etiqueta';
            if (opt.toLowerCase() === label.toLowerCase()) option.selected = true;
            select.appendChild(option);
        });
        select.onchange = function() {
            label = select.value;
            labelsElement.innerHTML = '';
            if (label) {
                const labelSpan = document.createElement('span');
                labelSpan.textContent = label.charAt(0).toUpperCase() + label.slice(1);
                labelSpan.className = label;
                labelsElement.appendChild(labelSpan);
            }
            taskContent.replaceChild(labelsElement, select);
            saveState();
        };
        taskContent.replaceChild(select, labelsElement);
        select.focus();
    };

    taskContent.appendChild(taskLabel);
    taskContent.appendChild(dueDateElement);
    taskContent.appendChild(labelsElement);

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
function createSubtask(subtaskText, dueDate = '') {
    const subtask = document.createElement('div');
    subtask.className = 'subtask';
    subtask.id = 'subtask-' + taskId++;
    subtask.draggable = true;
    subtask.addEventListener('dragstart', drag);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.onchange = function() {
        subtask.classList.toggle('completed');
        checkDueDates();
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

    const dueDateElement = document.createElement('span');
    dueDateElement.className = 'due-date';
    if (dueDate) {
        dueDateElement.textContent = new Date(dueDate).toLocaleDateString('pt-BR');
        if (new Date(dueDate) < new Date() && !subtask.classList.contains('completed')) {
            subtask.classList.add('overdue');
        }
    }
    dueDateElement.onclick = function() {
        const input = document.createElement('input');
        input.type = 'date';
        input.value = dueDate || '';
        input.onblur = function() {
            dueDate = input.value;
            dueDateElement.textContent = dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : '';
            subtask.classList.toggle('overdue', dueDate && new Date(dueDate) < new Date() && !subtask.classList.contains('completed'));
            subtask.replaceChild(dueDateElement, input);
            saveState();
        };
        input.onkeypress = function(e) {
            if (e.key === 'Enter') input.blur();
        };
        subtask.replaceChild(input, dueDateElement);
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
    subtask.appendChild(dueDateElement);
    subtask.appendChild(deleteButton);

    return subtask;
}

// Função para adicionar uma pasta
function addFolder() {
    const newFolder = {
        id: nextFolderId++,
        title: `Pasta ${folders.length + 1}`,
        color: getRandomColor(),
        columns: []
    };
    
    folders.push(newFolder);
    renderFolders();
            saveState();
}

// Função para renderizar as pastas
function renderFolders() {
    const foldersContainer = document.querySelector('.folders-container');
    foldersContainer.innerHTML = '';
    
    folders.forEach(folder => {
        const folderTemplate = document.getElementById('folder-template');
        const folderClone = document.importNode(folderTemplate.content, true);
        
        const folderElement = folderClone.querySelector('.folder');
        folderElement.dataset.folderId = folder.id;
        folderElement.style.borderColor = folder.color;
        
        const folderTitle = folderClone.querySelector('.folder-title');
        folderTitle.textContent = folder.title;
        folderTitle.style.color = folder.color;
        
        const folderContent = folderClone.querySelector('.folder-content');
        
        // Renderizar colunas dentro da pasta
        folder.columns.forEach(column => {
            const columnElement = createColumnElement(column);
            folderContent.appendChild(columnElement);
        });
        
        foldersContainer.appendChild(folderClone);
    });
}

// Função para editar uma pasta
function editFolder(button) {
    const folderElement = button.closest('.folder');
    const folderId = parseInt(folderElement.dataset.folderId);
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Editar Pasta</h3>
        <div class="form-group">
            <label for="folder-title">Título:</label>
            <input type="text" id="folder-title" value="${folder.title}">
        </div>
        <div class="form-group">
            <label for="folder-color">Cor:</label>
            <input type="color" id="folder-color" value="${folder.color}">
        </div>
        <button onclick="saveFolder(${folderId})" class="comic-button">Salvar</button>
    `;
    
    openModal();
}

// Função para salvar alterações em uma pasta
function saveFolder(folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    folder.title = document.getElementById('folder-title').value;
    folder.color = document.getElementById('folder-color').value;
    
    renderFolders();
        saveState();
    closeModal();
}

// Função para excluir uma pasta
function deleteFolder(button) {
    const folderElement = button.closest('.folder');
    const folderId = parseInt(folderElement.dataset.folderId);
    const folder = folders.find(f => f.id === folderId);
    
    if (!folder) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Confirmar Exclusão</h3>
        <div class="confirmation-message">
            <p>Tem certeza que deseja excluir a pasta <strong>"${folder.title}"</strong>?</p>
            <p>Todas as colunas e tarefas desta pasta serão removidas permanentemente.</p>
            <p>Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-actions">
            <button onclick="confirmDeleteFolder(${folderId})" class="comic-button danger-button">Excluir</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    openModal();
}

// Função para confirmar e executar a exclusão da pasta
function confirmDeleteFolder(folderId) {
    folders = folders.filter(f => f.id !== folderId);
    renderFolders();
        saveState();
    closeModal();
}

// Função para adicionar uma coluna
function addColumn() {
    // Se não houver pastas, crie uma
    if (folders.length === 0) {
        addFolder();
        return;
    }
    
    // Adicionar à primeira pasta por padrão
    addColumnToFolder(null, folders[0].id);
}

// Função para adicionar uma coluna a uma pasta específica
function addColumnToFolder(button, specificFolderId = null) {
    let folderId;
    
    if (specificFolderId) {
        folderId = specificFolderId;
    } else {
        const folderElement = button.closest('.folder');
        folderId = parseInt(folderElement.dataset.folderId);
    }
    
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    const newColumn = {
        id: nextColumnId++,
        title: `Coluna ${folder.columns.length + 1}`,
        color: folder.color,
        tasks: []
    };
    
    folder.columns.push(newColumn);
    renderFolders();
            saveState();
}

function createColumnElement(column) {
    const columnElement = document.createElement('div');
    columnElement.className = 'column';
    columnElement.dataset.columnId = column.id;
    columnElement.style.borderColor = column.color;
    
    const columnHeader = document.createElement('div');
    columnHeader.className = 'column-header';
    
    const columnTitle = document.createElement('h3');
    columnTitle.textContent = column.title;
    columnTitle.style.color = column.color;
    columnHeader.appendChild(columnTitle);
    
    const columnControls = document.createElement('div');
    columnControls.className = 'column-controls';

    const addTaskButton = document.createElement('button');
    addTaskButton.innerHTML = '<i class="fas fa-plus"></i>'; // Ícone de +
    addTaskButton.title = 'Adicionar Tarefa'; // Tooltip para acessibilidade
    addTaskButton.onclick = function() { addTask(column.id); };
    columnControls.appendChild(addTaskButton);
    
    const editColumnButton = document.createElement('button');
    editColumnButton.innerHTML = '<i class="fas fa-edit"></i>'; // Ícone de edição
    editColumnButton.title = 'Editar Coluna';
    editColumnButton.onclick = function() { editColumn(column.id); };
    columnControls.appendChild(editColumnButton);
    
    const deleteColumnButton = document.createElement('button');
    deleteColumnButton.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Ícone de lixeira
    deleteColumnButton.title = 'Excluir Coluna';
    deleteColumnButton.onclick = function(e) { 
        e.stopPropagation();
        deleteColumn(column.id); 
    };
    columnControls.appendChild(deleteColumnButton);
    
    const focusColumnButton = document.createElement('button');
    focusColumnButton.innerHTML = '<i class="fas fa-search-plus"></i>'; // Ícone de lupa maior
    focusColumnButton.title = 'Focar nesta coluna';
    focusColumnButton.onclick = function(e) {
        e.stopPropagation();
        focusOnElement('column', column.id);
    };
    columnControls.appendChild(focusColumnButton);
    
    columnHeader.appendChild(columnControls);
    columnElement.appendChild(columnHeader);

    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    taskList.dataset.columnId = column.id;
    
    // Adicionar eventos de arrastar e soltar
    taskList.addEventListener('dragover', allowDrop);
    taskList.addEventListener('drop', drop);
    
    // Renderizar tarefas
    column.tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
    
    columnElement.appendChild(taskList);
    return columnElement;
}

// Função para editar uma coluna
function editColumn(columnId) {
    let targetColumn = null;
    let parentFolder = null;
    
    // Encontrar a coluna e sua pasta pai
    for (const folder of folders) {
        const column = folder.columns.find(c => c.id === columnId);
        if (column) {
            targetColumn = column;
            parentFolder = folder;
            break;
        }
    }
    
    if (!targetColumn) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>Editar Coluna</h3>
        <div class="form-group">
            <label for="column-title">Título:</label>
            <input type="text" id="column-title" value="${targetColumn.title}">
        </div>
        <div class="form-group">
            <label for="column-color">Cor:</label>
            <input type="color" id="column-color" value="${targetColumn.color}">
        </div>
        <div class="form-group">
            <label for="column-folder">Pasta:</label>
            <select id="column-folder">
                ${folders.map(f => `<option value="${f.id}" ${f.id === parentFolder.id ? 'selected' : ''}>${f.title}</option>`).join('')}
            </select>
        </div>
        <button onclick="saveColumn(${columnId}, ${parentFolder.id})" class="comic-button">Salvar</button>
    `;
    
    openModal();
}

// Função para salvar alterações em uma coluna
function saveColumn(columnId, currentFolderId) {
    let targetColumn = null;
    let sourceFolder = null;
    
    // Encontrar a coluna e sua pasta atual
    for (const folder of folders) {
        const columnIndex = folder.columns.findIndex(c => c.id === columnId);
        if (columnIndex !== -1) {
            targetColumn = folder.columns[columnIndex];
            sourceFolder = folder;
            break;
        }
    }
    
    if (!targetColumn) return;
    
    // Atualizar propriedades da coluna
    targetColumn.title = document.getElementById('column-title').value;
    targetColumn.color = document.getElementById('column-color').value;
    
    // Verificar se a coluna precisa ser movida para outra pasta
    const newFolderId = parseInt(document.getElementById('column-folder').value);
    if (newFolderId !== currentFolderId) {
        // Remover da pasta atual
        sourceFolder.columns = sourceFolder.columns.filter(c => c.id !== columnId);
        
        // Adicionar à nova pasta
        const targetFolder = folders.find(f => f.id === newFolderId);
        if (targetFolder) {
            targetFolder.columns.push(targetColumn);
        }
    }
    
    renderFolders();
    saveState();
    closeModal();
}

// Função para excluir uma coluna
function deleteColumn(columnId) {
    // Encontrar a coluna
    let targetColumn = null;
    let parentFolder = null;
    
    for (const folder of folders) {
        const column = folder.columns.find(c => c.id === columnId);
        if (column) {
            targetColumn = column;
            parentFolder = folder;
            break;
        }
    }
    
    if (!targetColumn) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Confirmar Exclusão</h3>
        <div class="confirmation-message">
            <p>Tem certeza que deseja excluir a coluna <strong>"${targetColumn.title}"</strong>?</p>
            <p>Todas as tarefas desta coluna serão removidas permanentemente.</p>
            <p>Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-actions">
            <button onclick="confirmDeleteColumn(${columnId})" class="comic-button danger-button">Excluir</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    openModal();
}

// Função para confirmar e executar a exclusão da coluna
function confirmDeleteColumn(columnId) {
    // Encontrar e remover a coluna da pasta
    for (const folder of folders) {
        const columnIndex = folder.columns.findIndex(c => c.id === columnId);
        if (columnIndex !== -1) {
            folder.columns.splice(columnIndex, 1);
            renderFolders();
            saveState();
            closeModal();
            return;
        }
    }
}

// Função para adicionar uma tarefa
function addTask(columnId) {
    // Encontrar a coluna
    let targetColumn = null;
    
    for (const folder of folders) {
        targetColumn = folder.columns.find(c => c.id === columnId);
        if (targetColumn) break;
    }
    
    if (!targetColumn) return;
    
    const newTask = {
        id: nextTaskId++,
        title: `Tarefa ${targetColumn.tasks.length + 1}`,
        description: '',
        color: targetColumn.color,
        createdAt: new Date().toISOString()
    };
    
    targetColumn.tasks.push(newTask);
    renderFolders();
    saveState();
}

// Função para criar um elemento de tarefa usando o template
function createTaskElement(task) {
    const taskTemplate = document.getElementById('task-template');
    const taskClone = document.importNode(taskTemplate.content, true);
    
    const taskElement = taskClone.querySelector('.task');
    taskElement.dataset.taskId = task.id;
    taskElement.style.borderColor = task.color;
    
    // Configurar prioridade
    const priorityElement = taskElement.querySelector('.task-priority');
    if (task.priority === 'high') {
        priorityElement.classList.add('high');
    } else if (task.priority === 'medium') {
        priorityElement.classList.add('medium');
    } else if (task.priority === 'low') {
        priorityElement.classList.add('low');
    }
    
    // Configurar título
    const titleElement = taskElement.querySelector('.task-title');
    titleElement.textContent = task.title;
    titleElement.style.color = task.color;
    
    // Configurar data
    const dateElement = taskElement.querySelector('.task-date');
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dateElement.textContent = `📅 ${dueDate.toLocaleDateString('pt-BR')}`;
        
        // Verificar se está atrasada
        if (dueDate < new Date() && !task.completed) {
            taskElement.classList.add('overdue');
        }
    }
    
    // Configurar tags
    const tagsElement = taskElement.querySelector('.task-tags');
    if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
            const tagSpan = document.createElement('span');
            tagSpan.className = 'task-tag';
            tagSpan.textContent = tag;
            tagsElement.appendChild(tagSpan);
        });
    }
    
    // Configurar progresso
    const progressFill = taskElement.querySelector('.progress-fill');
    const progressText = taskElement.querySelector('.progress-text');
    const progress = task.progress || 0;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
    
    // Configurar estado de conclusão
    if (task.completed) {
        taskElement.classList.add('completed');
        progressFill.style.width = '100%';
        progressText.textContent = '100%';
    }
    
    // Adicionar checkbox para marcar como concluída
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed || false;
    checkbox.addEventListener('change', function() {
        task.completed = checkbox.checked;
        if (checkbox.checked) {
            taskElement.classList.add('completed');
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
        } else {
            taskElement.classList.remove('completed');
            progressFill.style.width = `${task.progress || 0}%`;
            progressText.textContent = `${task.progress || 0}%`;
        }
        saveState();
        updateTaskCounters();
    });
    
    // Inserir checkbox antes do título
    const taskContent = taskElement.querySelector('.task-content');
    taskContent.insertBefore(checkbox, taskContent.firstChild);
    
    // Configurar eventos de arrastar
    taskElement.addEventListener('dragstart', function(e) {
        draggedItem = task.id;
        draggedItemType = 'task';
        setTimeout(() => {
            taskElement.style.opacity = '0.5';
        }, 0);
    });
    
    taskElement.addEventListener('dragend', function() {
        taskElement.style.opacity = '1';
    });
    
    // Configurar botões de controle
    const editButton = taskElement.querySelector('.task-edit');
    editButton.onclick = function(e) {
        e.stopPropagation();
        editTask(task.id);
    };
    
    const deleteButton = taskElement.querySelector('.task-delete');
    deleteButton.onclick = function(e) {
        e.stopPropagation();
        confirmDeleteTask(task.id);
    };
    
    // Adicionar evento de clique para visualizar detalhes
    taskElement.addEventListener('click', function() {
        viewTaskDetails(task.id);
    });
    
    return taskElement;
}

// Função para editar uma tarefa
function editTask(taskId) {
    // Encontrar a tarefa
    let targetTask = null;
    let parentColumn = null;
    
    for (const folder of folders) {
        for (const column of folder.columns) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
                targetTask = task;
                parentColumn = column;
                break;
            }
        }
        if (targetTask) break;
    }
    
    if (!targetTask) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Editar Tarefa</h3>
        <div class="form-group">
            <label for="task-title">Título:</label>
            <input type="text" id="task-title" value="${targetTask.title}">
        </div>
        <div class="form-group">
            <label for="task-priority">Prioridade:</label>
            <select id="task-priority">
                <option value="none" ${!targetTask.priority || targetTask.priority === 'none' ? 'selected' : ''}>Nenhuma</option>
                <option value="low" ${targetTask.priority === 'low' ? 'selected' : ''}>Baixa</option>
                <option value="medium" ${targetTask.priority === 'medium' ? 'selected' : ''}>Média</option>
                <option value="high" ${targetTask.priority === 'high' ? 'selected' : ''}>Alta</option>
            </select>
        </div>
        <div class="form-group">
            <label for="task-due-date">Data de Vencimento:</label>
            <input type="date" id="task-due-date" value="${targetTask.dueDate || ''}">
        </div>
        <div class="form-group checkbox-group">
            <label>
                <input type="checkbox" id="task-completed" ${targetTask.completed ? 'checked' : ''}>
                Marcar como concluída
            </label>
        </div>
        <div class="modal-actions">
            <button onclick="saveTask(${taskId})" class="comic-button primary-button">Salvar</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    openModal();
}

// Função para salvar alterações em uma tarefa
function saveTask(taskId) {
    // Encontrar a tarefa
    let targetTask = null;
    
    for (const folder of folders) {
        for (const column of folder.columns) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
                targetTask = task;
                break;
            }
        }
        if (targetTask) break;
    }
    
    if (!targetTask) return;
    
    // Atualizar propriedades da tarefa
    targetTask.title = document.getElementById('task-title').value;
    targetTask.priority = document.getElementById('task-priority').value;
    targetTask.dueDate = document.getElementById('task-due-date').value;
    targetTask.completed = document.getElementById('task-completed').checked;
    
    renderFolders();
                saveState();
    updateTaskCounters();
    closeModal();
}

// Função para confirmar exclusão de tarefa
function confirmDeleteTask(taskId) {
    // Encontrar a tarefa
    let targetTask = null;
    
    for (const folder of folders) {
        for (const column of folder.columns) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
                targetTask = task;
                break;
            }
        }
        if (targetTask) break;
    }
    
    if (!targetTask) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Confirmar Exclusão</h3>
        <div class="confirmation-message">
            <p>Tem certeza que deseja excluir a tarefa <strong>"${targetTask.title}"</strong>?</p>
            <p>Esta ação não pode ser desfeita.</p>
        </div>
        <div class="modal-actions">
            <button onclick="deleteTask(${taskId})" class="comic-button danger-button">Excluir</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    openModal();
}

// Função para excluir uma tarefa
function deleteTask(taskId) {
    // Encontrar e remover a tarefa
    for (const folder of folders) {
        for (const column of folder.columns) {
            const taskIndex = column.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                column.tasks.splice(taskIndex, 1);
                renderFolders();
                saveState();
                updateTaskCounters();
                closeModal();
                return;
            }
        }
    }
}

// Função para visualizar detalhes de uma tarefa
function viewTaskDetails(taskId) {
    // Encontrar a tarefa
    let targetTask = null;
    
    for (const folder of folders) {
        for (const column of folder.columns) {
            const task = column.tasks.find(t => t.id === taskId);
            if (task) {
                targetTask = task;
                break;
            }
        }
        if (targetTask) break;
    }
    
    if (!targetTask) return;
    
    const createdDate = new Date(targetTask.createdAt).toLocaleString();
    const dueDate = targetTask.dueDate ? new Date(targetTask.dueDate).toLocaleDateString('pt-BR') : 'Não definida';
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title" style="color: ${targetTask.color}">${targetTask.title}</h3>
        
        <div class="task-details">
            <div class="detail-item">
                <span class="detail-label">Criado em:</span>
                <span class="detail-value">${createdDate}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Data de vencimento:</span>
                <span class="detail-value">${dueDate}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Prioridade:</span>
                <span class="detail-value priority-badge ${targetTask.priority || 'none'}">${getPriorityLabel(targetTask.priority)}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Progresso:</span>
                <div class="progress-bar detail-progress">
                    <div class="progress-fill" style="width: ${targetTask.progress || 0}%"></div>
                </div>
                <span class="progress-text">${targetTask.progress || 0}%</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">Status:</span>
                <span class="detail-value status-badge ${targetTask.completed ? 'completed' : ''}">${targetTask.completed ? 'Concluída' : 'Pendente'}</span>
            </div>
            
            ${targetTask.tags && targetTask.tags.length > 0 ? `
            <div class="detail-item">
                <span class="detail-label">Tags:</span>
                <div class="detail-tags">
                    ${targetTask.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="detail-section">
            <h4>Descrição</h4>
            <div class="task-description">
                ${targetTask.description ? targetTask.description.replace(/\n/g, '<br>') : '<em>Sem descrição</em>'}
            </div>
        </div>
        
        <div class="modal-actions">
            <button onclick="editTask(${taskId})" class="comic-button primary-button">Editar</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Fechar</button>
        </div>
    `;
    
    openModal();
}

// Função para obter o rótulo da prioridade
function getPriorityLabel(priority) {
    switch (priority) {
        case 'high': return 'Alta';
        case 'medium': return 'Média';
        case 'low': return 'Baixa';
        default: return 'Nenhuma';
    }
}

// Função de busca melhorada
function searchTasks() {
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!query) {
        // Se a busca estiver vazia, mostrar todas as tarefas
        document.querySelectorAll('.task').forEach(task => {
            task.style.display = '';
        });
        document.querySelectorAll('.folder').forEach(folder => {
            folder.style.display = '';
        });
        document.querySelectorAll('.column').forEach(column => {
            column.style.display = '';
        });
        return;
    }
    
    // Ocultar todas as pastas e colunas inicialmente
    document.querySelectorAll('.folder').forEach(folder => {
        folder.style.display = 'none';
    });
    
    document.querySelectorAll('.column').forEach(column => {
        column.style.display = 'none';
    });
    
    // Verificar cada tarefa
    let foundTasks = false;
    document.querySelectorAll('.task').forEach(task => {
        const title = task.querySelector('.task-title').textContent.toLowerCase();
        const description = task.dataset.description ? task.dataset.description.toLowerCase() : '';
        const tags = task.querySelectorAll('.task-tag');
        
        let matchesTags = false;
        tags.forEach(tag => {
            if (tag.textContent.toLowerCase().includes(query)) {
                matchesTags = true;
            }
        });
        
        const matches = title.includes(query) || description.includes(query) || matchesTags;
        
        if (matches) {
            task.style.display = '';
            foundTasks = true;
            
            // Mostrar a coluna e pasta pai
            const column = task.closest('.column');
            if (column) {
                column.style.display = '';
                const folder = column.closest('.folder');
                if (folder) {
                    folder.style.display = '';
                }
            }
        } else {
            task.style.display = 'none';
        }
    });
    
    // Mostrar mensagem se nenhuma tarefa for encontrada
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
        noResultsMessage.style.display = foundTasks ? 'none' : 'block';
    }
}

// Função para mostrar ajuda
function showHelp() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Ajuda do TaskFlow</h3>
        
        <div class="help-section">
            <h4>Como usar o TaskFlow</h4>
            <ul>
                <li><strong>Pastas:</strong> Organize suas tarefas em pastas temáticas</li>
                <li><strong>Colunas:</strong> Crie colunas dentro das pastas para organizar o fluxo de trabalho</li>
                <li><strong>Tarefas:</strong> Adicione tarefas às colunas com detalhes, prazos e prioridades</li>
            </ul>
        </div>
        
        <div class="help-section">
            <h4>Funcionalidades</h4>
            <ul>
                <li>Arraste e solte tarefas entre colunas</li>
                <li>Marque tarefas como concluídas</li>
                <li>Defina prioridades e prazos</li>
                <li>Acompanhe o progresso das tarefas</li>
                <li>Busque tarefas por título, descrição ou tags</li>
                <li>Exporte e importe seus dados</li>
            </ul>
        </div>
        
        <div class="modal-actions">
            <button onclick="closeModal()" class="comic-button primary-button">Entendi</button>
        </div>
    `;
    
    openModal();
}

// Função para mostrar atalhos
function showShortcuts() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Atalhos de Teclado</h3>
        
        <div class="shortcuts-section">
            <table class="shortcuts-table">
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                    <td>Focar na busca</td>
                </tr>
                <tr>
                    <td><kbd>Esc</kbd></td>
                    <td>Fechar modal</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>N</kbd></td>
                    <td>Nova pasta</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></td>
                    <td>Nova coluna</td>
                </tr>
                <tr>
                    <td><kbd>Ctrl</kbd> + <kbd>D</kbd></td>
                    <td>Alternar tema claro/escuro</td>
                </tr>
            </table>
        </div>
        
        <div class="modal-actions">
            <button onclick="closeModal()" class="comic-button primary-button">Entendi</button>
        </div>
    `;
    
    openModal();
}

// Função para confirmar limpeza de dados
function clearAllData() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3 class="modal-title">Confirmar Limpeza de Dados</h3>
        
        <div class="confirmation-message warning">
            <p><strong>Atenção!</strong> Você está prestes a excluir todos os seus dados.</p>
            <p>Todas as pastas, colunas e tarefas serão removidas permanentemente.</p>
            <p>Esta ação não pode ser desfeita.</p>
        </div>
        
        <div class="modal-actions">
            <button onclick="confirmClearData()" class="comic-button danger-button">Sim, limpar tudo</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    openModal();
}

// Função para confirmar e executar limpeza de dados
function confirmClearData() {
    localStorage.removeItem('taskflowState');
    folders = [];
    nextFolderId = 1;
    nextColumnId = 1;
    nextTaskId = 1;
    
    renderFolders();
    updateTaskCounters();
    closeModal();
    
    // Adicionar uma pasta padrão após limpar
    addFolder();
}

// Adicionar eventos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl + F: Focar na busca
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
    }
    
    // Esc: Fechar modal
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Ctrl + N: Nova pasta
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addFolder();
    }
    
    // Ctrl + Shift + N: Nova coluna
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        addColumn();
    }
    
    // Ctrl + D: Alternar tema
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
    }
});

// Funções para arrastar e soltar
function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    
    if (draggedItemType !== 'task' || !draggedItem) return;
    
    const targetColumnId = parseInt(e.currentTarget.dataset.columnId);
    
    // Encontrar a tarefa e sua coluna atual
    let sourceColumn = null;
    let sourceFolder = null;
    let targetTask = null;
    
    outerLoop:
    for (const folder of folders) {
        for (const column of folder.columns) {
            const taskIndex = column.tasks.findIndex(t => t.id === draggedItem);
            if (taskIndex !== -1) {
                sourceColumn = column;
                sourceFolder = folder;
                targetTask = column.tasks[taskIndex];
                // Remover da coluna atual
                column.tasks.splice(taskIndex, 1);
                break outerLoop;
            }
        }
    }
    
    if (!targetTask) return;
    
    // Adicionar à nova coluna
    for (const folder of folders) {
        const targetColumn = folder.columns.find(c => c.id === targetColumnId);
        if (targetColumn) {
            targetColumn.tasks.push(targetTask);
            renderFolders();
            saveState();
            return;
        }
    }
}

// Funções para gerenciar o modal
function openModal() {
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Funções para salvar e carregar o estado
function saveState() {
    const state = {
        folders: folders,
        nextFolderId: nextFolderId,
        nextColumnId: nextColumnId,
        nextTaskId: nextTaskId
    };
    
    localStorage.setItem('taskflowState', JSON.stringify(state));
    updateTaskCounters();
}

function loadState() {
    const savedState = localStorage.getItem('taskflowState');
    
    if (savedState) {
        const state = JSON.parse(savedState);
        folders = state.folders || [];
        nextFolderId = state.nextFolderId || 1;
        nextColumnId = state.nextColumnId || 1;
        nextTaskId = state.nextTaskId || 1;
    }
}

function exportState() {
    const state = {
        folders: folders,
        nextFolderId: nextFolderId,
        nextColumnId: nextColumnId,
        nextTaskId: nextTaskId
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "taskflow_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importState(event) {
    const file = event.target.files[0];
    if (!file) return;
    
        const reader = new FileReader();
        reader.onload = function(e) {
        try {
            const state = JSON.parse(e.target.result);
            folders = state.folders || [];
            nextFolderId = state.nextFolderId || 1;
            nextColumnId = state.nextColumnId || 1;
            nextTaskId = state.nextTaskId || 1;
            
            renderFolders();
            saveState();
        } catch (error) {
            alert('Erro ao importar arquivo: ' + error.message);
        }
        };
        reader.readAsText(file);
}

// Funções utilitárias
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Verificar datas de vencimento
function checkDueDates() {
    document.querySelectorAll('.task').forEach(task => {
        const dueDateElement = task.querySelector('.due-date');
        const dueDate = dueDateElement.textContent.replace('Vence: ', '');
        const isOverdue = dueDate && new Date(dueDate) < new Date() && !task.classList.contains('completed');
        task.classList.toggle('overdue', isOverdue);
    });
    document.querySelectorAll('.subtask').forEach(subtask => {
        const dueDateElement = subtask.querySelector('.due-date');
        const dueDate = dueDateElement.textContent;
        const isOverdue = dueDate && new Date(dueDate) < new Date() && !subtask.classList.contains('completed');
        subtask.classList.toggle('overdue', isOverdue);
    });
}

// Alternância de tema
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    saveThemePreference();
}

function saveThemePreference() {
    const isDarkTheme = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    localStorage.setItem('currentTheme', currentTheme);
    
    if (customTheme) {
        localStorage.setItem('customTheme', JSON.stringify(customTheme));
    } else {
        localStorage.removeItem('customTheme');
    }
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
    
    // Carregar tema personalizado ou predefinido
    const savedCustomTheme = localStorage.getItem('customTheme');
    if (savedCustomTheme) {
        customTheme = JSON.parse(savedCustomTheme);
        applyCustomTheme();
    } else {
        const savedCurrentTheme = localStorage.getItem('currentTheme');
        if (savedCurrentTheme && predefinedThemes[savedCurrentTheme]) {
            currentTheme = savedCurrentTheme;
            applyTheme(currentTheme);
        }
    }
}

// Atualizar contadores de tarefas
function updateTaskCounters() {
    const totalTasks = folders.reduce((sum, folder) => sum + folder.columns.reduce((colSum, column) => colSum + column.tasks.length, 0), 0);
    const completedTasks = folders.reduce((sum, folder) => sum + folder.columns.reduce((colSum, column) => colSum + column.tasks.filter(task => task.completed).length, 0), 0);
    const overdueTasks = folders.reduce((sum, folder) => sum + folder.columns.reduce((colSum, column) => colSum + column.tasks.filter(task => task.overdue).length, 0), 0);
    const pendingTasks = totalTasks - completedTasks;

    document.getElementById('total-tasks-count').textContent = totalTasks;
    document.getElementById('completed-tasks-count').textContent = completedTasks;
    document.getElementById('pending-tasks-count').textContent = pendingTasks;
    document.getElementById('overdue-tasks-count').textContent = overdueTasks;
}

// Função para filtrar tarefas por status
function filterTasks(filterType) {
    // Atualizar botões de filtro
    document.querySelectorAll('.filter-button').forEach(button => {
        button.classList.toggle('active', button.dataset.filter === filterType);
    });
    
    // Resetar a busca de texto
    document.getElementById('search-input').value = '';
    
    // Mostrar todas as pastas e colunas
    document.querySelectorAll('.folder').forEach(folder => {
        folder.style.display = '';
    });
    
    document.querySelectorAll('.column').forEach(column => {
        column.style.display = '';
    });
    
    // Filtrar tarefas com base no tipo de filtro
    let foundTasks = false;
    document.querySelectorAll('.task').forEach(task => {
        const isCompleted = task.classList.contains('completed');
        const isOverdue = task.classList.contains('overdue');
        
        let shouldShow = false;
        
        switch (filterType) {
            case 'all':
                shouldShow = true;
                break;
            case 'pending':
                shouldShow = !isCompleted;
                break;
            case 'completed':
                shouldShow = isCompleted;
                break;
            case 'overdue':
                shouldShow = isOverdue && !isCompleted;
                break;
        }
        
        task.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
            foundTasks = true;
        }
    });
    
    // Verificar colunas vazias e ocultá-las
    document.querySelectorAll('.column').forEach(column => {
        const visibleTasks = column.querySelectorAll('.task[style="display: none;"]').length;
        const totalTasks = column.querySelectorAll('.task').length;
        
        if (visibleTasks === totalTasks && totalTasks > 0) {
            column.style.display = 'none';
        }
    });
    
    // Verificar pastas vazias e ocultá-las
    document.querySelectorAll('.folder').forEach(folder => {
        const visibleColumns = folder.querySelectorAll('.column[style="display: none;"]').length;
        const totalColumns = folder.querySelectorAll('.column').length;
        
        if (visibleColumns === totalColumns && totalColumns > 0) {
            folder.style.display = 'none';
        }
    });
    
    // Mostrar mensagem se nenhuma tarefa for encontrada
    const noResultsMessage = document.getElementById('no-results-message');
    if (noResultsMessage) {
        noResultsMessage.style.display = foundTasks ? 'none' : 'block';
    }
}

// Função para alternar entre visualização normal e compacta
function toggleCompactView() {
    document.body.classList.toggle('compact-view');
    const button = document.getElementById('compact-view-btn');
    button.classList.toggle('active');
    
    // Salvar preferência
    const isCompactView = document.body.classList.contains('compact-view');
    localStorage.setItem('compactView', isCompactView ? 'true' : 'false');
}

// Função para carregar a preferência de visualização
function loadViewPreference() {
    const savedView = localStorage.getItem('compactView');
    if (savedView === 'true') {
        document.body.classList.add('compact-view');
        document.getElementById('compact-view-btn').classList.add('active');
    }
}

// Função para ordenar tarefas
function sortTasks(field, direction) {
    currentSortField = field;
    currentSortDirection = direction;
    
    // Atualizar visual dos botões de ordenação
    document.querySelectorAll('.sort-dropdown-content a').forEach(item => {
        const isActive = item.textContent.toLowerCase().includes(field) && 
                         ((direction === 'asc' && item.textContent.includes('A-Z')) || 
                          (direction === 'desc' && item.textContent.includes('Z-A')) ||
                          (field === 'dueDate' && direction === 'asc' && item.textContent.includes('Próximas')) ||
                          (field === 'dueDate' && direction === 'desc' && item.textContent.includes('Distantes')) ||
                          (field === 'priority' && direction === 'desc' && item.textContent.includes('Alta-Baixa')) ||
                          (field === 'priority' && direction === 'asc' && item.textContent.includes('Baixa-Alta')) ||
                          (field === 'completed' && direction === 'asc' && item.textContent.includes('Pendentes')) ||
                          (field === 'completed' && direction === 'desc' && item.textContent.includes('Concluídas')));
        
        if (isActive) {
            document.getElementById('sort-btn').classList.add('sort-active');
        }
    });
    
    // Aplicar ordenação em todas as colunas
    for (const folder of folders) {
        for (const column of folder.columns) {
            sortColumnTasks(column, field, direction);
        }
    }
    
    // Renderizar as pastas com as tarefas ordenadas
    renderFolders();
    
    // Salvar a preferência de ordenação
    localStorage.setItem('sortField', field);
    localStorage.setItem('sortDirection', direction);
}

// Função para ordenar as tarefas de uma coluna específica
function sortColumnTasks(column, field, direction) {
    column.tasks.sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'title':
                comparison = a.title.localeCompare(b.title, 'pt-BR');
                break;
                
            case 'dueDate':
                // Tratar casos onde dueDate não existe
                const dateA = a.dueDate ? new Date(a.dueDate) : new Date(8640000000000000);
                const dateB = b.dueDate ? new Date(b.dueDate) : new Date(8640000000000000);
                comparison = dateA - dateB;
                break;
                
            case 'priority':
                // Converter prioridade para valor numérico
                const priorityValues = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0, undefined: 0 };
                comparison = priorityValues[a.priority] - priorityValues[b.priority];
                break;
                
            case 'completed':
                // Ordenar por status de conclusão
                const completedA = a.completed ? 1 : 0;
                const completedB = b.completed ? 1 : 0;
                comparison = completedA - completedB;
                break;
        }
        
        // Aplicar direção da ordenação
        return direction === 'asc' ? comparison : -comparison;
    });
}

// Função para carregar a preferência de ordenação
function loadSortPreference() {
    const savedSortField = localStorage.getItem('sortField');
    const savedSortDirection = localStorage.getItem('sortDirection');
    
    if (savedSortField && savedSortDirection) {
        sortTasks(savedSortField, savedSortDirection);
    }
}

// Função para alternar a visibilidade do timer Pomodoro
function togglePomodoro() {
    const pomodoroModal = document.getElementById('pomodoro-modal');
    const pomodoroBtn = document.getElementById('pomodoro-btn');
    
    if (pomodoroModal.style.display === 'block') {
        pomodoroModal.style.display = 'none';
        if (!pomodoroRunning) {
            pomodoroBtn.classList.remove('active');
        }
    } else {
        pomodoroModal.style.display = 'block';
        pomodoroBtn.classList.add('active');
        loadPomodoroSettings();
    }
}

// Função para iniciar o timer Pomodoro
function startPomodoro() {
    if (pomodoroRunning) return;
    
    pomodoroRunning = true;
    document.getElementById('pomodoro-btn').classList.add('active');
    document.getElementById('start-timer').disabled = true;
    document.getElementById('pause-timer').disabled = false;
    
    pomodoroTimer = setInterval(updatePomodoroTimer, 1000);
}

// Função para pausar o timer Pomodoro
function pausePomodoro() {
    if (!pomodoroRunning) return;
    
    pomodoroRunning = false;
    document.getElementById('start-timer').disabled = false;
    document.getElementById('pause-timer').disabled = true;
    
    clearInterval(pomodoroTimer);
}

// Função para reiniciar o timer Pomodoro
function resetPomodoro() {
    pausePomodoro();
    
    // Resetar para o modo atual
    if (pomodoroMode === 'focus') {
        pomodoroMinutes = pomodoroSettings.focusTime;
    } else if (pomodoroMode === 'break') {
        pomodoroMinutes = pomodoroSettings.breakTime;
    } else {
        pomodoroMinutes = pomodoroSettings.longBreakTime;
    }
    
    pomodoroSeconds = 0;
    updatePomodoroDisplay();
}

// Função para atualizar o timer Pomodoro a cada segundo
function updatePomodoroTimer() {
    if (pomodoroSeconds === 0) {
        if (pomodoroMinutes === 0) {
            // Timer acabou, mudar para o próximo modo
            clearInterval(pomodoroTimer);
            playPomodoroSound();
            
            if (pomodoroMode === 'focus') {
                // Incrementar estatísticas
                pomodoroCycles++;
                totalFocusTime += pomodoroSettings.focusTime;
                updatePomodoroStats();
                
                // Verificar se é hora de uma pausa longa
                if (pomodoroCycles % pomodoroSettings.cyclesBeforeLongBreak === 0) {
                    switchPomodoroMode('longBreak');
                } else {
                    switchPomodoroMode('break');
                }
            } else {
                // Voltar para o modo de foco após uma pausa
                switchPomodoroMode('focus');
            }
            
            // Reiniciar o timer automaticamente
            startPomodoro();
            return;
        }
        
        pomodoroMinutes--;
        pomodoroSeconds = 59;
    } else {
        pomodoroSeconds--;
    }
    
    updatePomodoroDisplay();
}

// Função para mudar o modo do Pomodoro
function switchPomodoroMode(mode) {
    pomodoroMode = mode;
    
    if (mode === 'focus') {
        pomodoroMinutes = pomodoroSettings.focusTime;
        document.getElementById('timer-mode-label').textContent = 'Modo: Foco';
        document.getElementById('timer-mode-label').style.color = 'var(--primary-color)';
    } else if (mode === 'break') {
        pomodoroMinutes = pomodoroSettings.breakTime;
        document.getElementById('timer-mode-label').textContent = 'Modo: Pausa Curta';
        document.getElementById('timer-mode-label').style.color = 'var(--success-color)';
    } else {
        pomodoroMinutes = pomodoroSettings.longBreakTime;
        document.getElementById('timer-mode-label').textContent = 'Modo: Pausa Longa';
        document.getElementById('timer-mode-label').style.color = 'var(--accent-color)';
    }
    
    pomodoroSeconds = 0;
    updatePomodoroDisplay();
    
    // Notificar o usuário sobre a mudança de modo
    showPomodoroNotification(mode);
}

// Função para atualizar o display do timer
function updatePomodoroDisplay() {
    document.getElementById('timer-minutes').textContent = pomodoroMinutes.toString().padStart(2, '0');
    document.getElementById('timer-seconds').textContent = pomodoroSeconds.toString().padStart(2, '0');
}

// Função para atualizar as estatísticas do Pomodoro
function updatePomodoroStats() {
    document.getElementById('completed-cycles').textContent = pomodoroCycles;
    document.getElementById('total-focus-time').textContent = `${totalFocusTime} min`;
}

// Função para atualizar as configurações do Pomodoro
function updatePomodoroSettings() {
    pomodoroSettings.focusTime = parseInt(document.getElementById('focus-time').value) || 25;
    pomodoroSettings.breakTime = parseInt(document.getElementById('break-time').value) || 5;
    pomodoroSettings.longBreakTime = parseInt(document.getElementById('long-break-time').value) || 15;
    pomodoroSettings.cyclesBeforeLongBreak = parseInt(document.getElementById('pomodoro-cycles').value) || 4;
    
    // Salvar configurações
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
    
    // Atualizar o timer atual se não estiver em execução
    if (!pomodoroRunning) {
        resetPomodoro();
    }
}

// Função para carregar as configurações do Pomodoro
function loadPomodoroSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    
    if (savedSettings) {
        pomodoroSettings = JSON.parse(savedSettings);
        
        document.getElementById('focus-time').value = pomodoroSettings.focusTime;
        document.getElementById('break-time').value = pomodoroSettings.breakTime;
        document.getElementById('long-break-time').value = pomodoroSettings.longBreakTime;
        document.getElementById('pomodoro-cycles').value = pomodoroSettings.cyclesBeforeLongBreak;
    }
    
    // Carregar estatísticas salvas
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        pomodoroCycles = stats.cycles || 0;
        totalFocusTime = stats.focusTime || 0;
        updatePomodoroStats();
    }
    
    // Inicializar o display
    if (pomodoroMode === 'focus') {
        pomodoroMinutes = pomodoroSettings.focusTime;
    } else if (pomodoroMode === 'break') {
        pomodoroMinutes = pomodoroSettings.breakTime;
    } else {
        pomodoroMinutes = pomodoroSettings.longBreakTime;
    }
    
    updatePomodoroDisplay();
}

// Função para salvar as estatísticas do Pomodoro
function savePomodoroStats() {
    const stats = {
        cycles: pomodoroCycles,
        focusTime: totalFocusTime
    };
    
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// Função para tocar um som quando o timer terminar
function playPomodoroSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQcZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8OCRQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdT0z3wvBSF0xPDglEQKElux6eyrWRUJQ5vd8sFuJAUug8/y1oU2Bhxqvu7mnEoPDVKq5PC0YRoGPJLY88p3KgUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQcZZ7zs56BODwxPpuPxtmQcBjiP1/PMeywGI3fH8OCRQQkUXbPq66hWFQlGnt/yv2wiBDCG0PPUgzUEHm2/7uSaSQ0PVqzm7rJeGAc9ltrzyHUpBSh9y/HajDsHGGO46+mjUREKTKPi8blnHgU1jdTy0HwvBSF0xPDglEQKElux6eyrWhQIQ5vd88FwJAQug8/y1oY3BRxqvu3nnEwODVKp5PC1YRoGOpPX88p3KgUmecnw3Y4/CBVhtuvqpVMSC0mh4PG9aiAFM4jS89GBMgUfccLv45dGCxFYrufur1sYB0CX2/PEcycFKoDN8tiKOgYZZ7rs56BOEQpPpuPxt2MdBTeP1vTNei4FI3bH7+GSQQkUXbPq66hWFQlGnd7zv2wiBDCF0PPUgzUEHm2/7uSaSQ0PVqzm7rJeGAc9lNrzyHUpBCh9y/HajDwGGGO46+mjUhAKS6Pi8bpoHwQ1jdTy0H4wBCF0w+/hlUQKElux6eyrWhQIQ5vd88NvJAUtg87y1oY3BRxpve3nnEwODVKp5PC1YRsFOpPY88p3LAQlecrx3Y4/CBVhtuvqpVMSC0mh4PG9aiAFMojS89GBMgUfccLv45dGDBBYrufur1sYB0CX2/PGcSgEKoDN8tiKOgYZZ7rs56BOEQpPpuPxt2UcBDeP1vTNei4FI3bH7+GSQQsUXbPq66hWFQlGnd7zv2wiBDCF0PPUhDQEHm2/7uSaSQ0PVKzm7rJeGAc9lNnzyHUpBCh9y/HajDwGGGO46+mjUhAKS6Pi8bpoHwQ1jdTy0H4wBCF0w+/hlUQKElqw6eyrWhQIQ5vd88NvJQUsgs/y1oY3BRxpve3nnU0NDVG=');
        audio.play();
    } catch (e) {
        console.log('Não foi possível tocar o som de notificação');
    }
}

// Função para mostrar uma notificação quando o modo mudar
function showPomodoroNotification(mode) {
    let title, message;
    
    if (mode === 'focus') {
        title = 'Hora de Focar!';
        message = 'Concentre-se na sua tarefa por ' + pomodoroSettings.focusTime + ' minutos.';
    } else if (mode === 'break') {
        title = 'Hora da Pausa!';
        message = 'Descanse por ' + pomodoroSettings.breakTime + ' minutos.';
    } else {
        title = 'Pausa Longa!';
        message = 'Aproveite um descanso de ' + pomodoroSettings.longBreakTime + ' minutos.';
    }
    
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        }
    }
}

// Adicionar à função window.onbeforeunload para salvar as estatísticas do Pomodoro
window.onbeforeunload = function() {
    savePomodoroStats();
};

// Função para alternar o Modo de Foco
function toggleFocusMode() {
    const focusModeBtn = document.getElementById('focus-mode-btn');
    
    if (focusModeActive) {
        // Desativar o modo de foco
        document.body.classList.remove('focus-mode');
        focusModeBtn.classList.remove('active');
        focusModeActive = false;
        focusedElementId = null;
        focusedElementType = null;
        
        // Remover classes de foco de todos os elementos
        document.querySelectorAll('.folder.focused, .column.focused').forEach(el => {
            el.classList.remove('focused');
        });
        
        // Remover notificação de foco
        removeFocusNotification();
        
        // Salvar estado do modo de foco
        localStorage.setItem('focusModeActive', 'false');
        localStorage.removeItem('focusedElementId');
        localStorage.removeItem('focusedElementType');
    } else {
        // Mostrar modal para escolher o elemento para focar
        showFocusSelectionModal();
    }
}

// Função para mostrar o modal de seleção de foco
function showFocusSelectionModal() {
    const modalBody = document.getElementById('modal-body');
    
    let foldersHtml = '';
    folders.forEach(folder => {
        foldersHtml += `
            <div class="focus-selection-item" onclick="focusOnElement('folder', ${folder.id})">
                <span class="focus-folder-icon">📁</span>
                <span class="focus-item-title">${folder.title}</span>
            </div>
        `;
        
        folder.columns.forEach(column => {
            foldersHtml += `
                <div class="focus-selection-item column-item" onclick="focusOnElement('column', ${column.id})">
                    <span class="focus-column-icon">📊</span>
                    <span class="focus-item-title">${column.title}</span>
                    <span class="focus-item-subtitle">(em ${folder.title})</span>
                </div>
            `;
        });
    });
    
    modalBody.innerHTML = `
        <h3 class="modal-title">Escolha onde focar</h3>
        <p class="focus-selection-intro">Selecione uma pasta ou coluna para entrar no modo de foco:</p>
        <div class="focus-selection-list">
            ${foldersHtml || '<p class="no-items">Nenhuma pasta ou coluna disponível</p>'}
        </div>
        <div class="modal-actions">
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    // Adicionar estilos para o modal de seleção
    const style = document.createElement('style');
    style.id = 'focus-selection-styles';
    style.textContent = `
        .focus-selection-intro {
            text-align: center;
            margin-bottom: 15px;
            color: var(--text-secondary);
        }
        .focus-selection-list {
            max-height: 300px;
            overflow-y: auto;
            margin-bottom: 20px;
            border: 1px solid var(--border-light);
            border-radius: 8px;
            padding: 5px;
        }
        .focus-selection-item {
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s;
        }
        .focus-selection-item:hover {
            background-color: var(--bg-color);
            transform: translateX(5px);
        }
        .focus-folder-icon, .focus-column-icon {
            margin-right: 10px;
            font-size: 1.2rem;
        }
        .focus-item-title {
            font-weight: bold;
            flex: 1;
        }
        .focus-item-subtitle {
            font-size: 0.8rem;
            color: var(--text-secondary);
        }
        .column-item {
            padding-left: 30px;
            background-color: rgba(0,0,0,0.02);
        }
        .no-items {
            text-align: center;
            padding: 20px;
            color: var(--text-secondary);
        }
    `;
    
    if (!document.getElementById('focus-selection-styles')) {
        document.head.appendChild(style);
    }
    
    openModal();
}

// Função para focar em um elemento específico
function focusOnElement(type, id) {
    focusModeActive = true;
    focusedElementId = id;
    focusedElementType = type;
    
    // Ativar o modo de foco
    document.body.classList.add('focus-mode');
    document.getElementById('focus-mode-btn').classList.add('active');
    
    // Fechar o modal
    closeModal();
    
    // Aplicar classe de foco ao elemento selecionado
    if (type === 'folder') {
        const folderElement = document.querySelector(`.folder[data-folder-id="${id}"]`);
        if (folderElement) {
            folderElement.classList.add('focused');
        }
    } else if (type === 'column') {
        const columnElement = document.querySelector(`.column[data-column-id="${id}"]`);
        if (columnElement) {
            columnElement.classList.add('focused');
            // Também adicionar classe focused à pasta pai
            const folderElement = columnElement.closest('.folder');
            if (folderElement) {
                folderElement.classList.add('focused');
            }
        }
    }
    
    // Mostrar notificação de foco
    showFocusNotification(type, id);
    
    // Salvar estado do modo de foco
    localStorage.setItem('focusModeActive', 'true');
    localStorage.setItem('focusedElementId', id);
    localStorage.setItem('focusedElementType', type);
}

// Função para focar em uma pasta a partir do botão na pasta
function focusOnFolder(button) {
    const folderElement = button.closest('.folder');
    const folderId = parseInt(folderElement.dataset.folderId);
    
    focusOnElement('folder', folderId);
}

// Função para mostrar notificação de foco
function showFocusNotification(type, id) {
    // Remover notificação existente
    removeFocusNotification();
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = 'focus-notification';
    notification.id = 'focus-notification';
    
    let elementName = '';
    if (type === 'folder') {
        const folder = folders.find(f => f.id === id);
        elementName = folder ? folder.title : 'pasta';
    } else if (type === 'column') {
        let columnName = '';
        let folderName = '';
        
        for (const folder of folders) {
            const column = folder.columns.find(c => c.id === id);
    if (column) {
                columnName = column.title;
                folderName = folder.title;
                break;
            }
        }
        
        elementName = columnName ? `${columnName} (em ${folderName})` : 'coluna';
    }
    
    notification.innerHTML = `
        <span>Modo de foco ativo: ${elementName}</span>
        <button onclick="toggleFocusMode()">Sair do modo de foco</button>
    `;
    
    document.body.appendChild(notification);
    
    // Remover a notificação após 5 segundos
    setTimeout(() => {
        const notif = document.getElementById('focus-notification');
        if (notif) {
            notif.style.opacity = '0';
            notif.style.transform = 'translate(-50%, 100px)';
            setTimeout(() => {
                if (notif.parentNode) {
                    notif.parentNode.removeChild(notif);
                }
            }, 300);
        }
    }, 5000);
}

// Função para remover notificação de foco
function removeFocusNotification() {
    const notification = document.getElementById('focus-notification');
    if (notification) {
        notification.parentNode.removeChild(notification);
    }
}

// Função para carregar o estado do modo de foco
function loadFocusModeState() {
    const focusModeActive = localStorage.getItem('focusModeActive') === 'true';
    
    if (focusModeActive) {
        const focusedElementId = parseInt(localStorage.getItem('focusedElementId'));
        const focusedElementType = localStorage.getItem('focusedElementType');
        
        if (focusedElementId && focusedElementType) {
            // Verificar se o elemento ainda existe
            let elementExists = false;
            
            if (focusedElementType === 'folder') {
                elementExists = folders.some(f => f.id === focusedElementId);
            } else if (focusedElementType === 'column') {
                for (const folder of folders) {
                    if (folder.columns.some(c => c.id === focusedElementId)) {
                        elementExists = true;
                        break;
                    }
                }
            }
            
            if (elementExists) {
                // Restaurar o modo de foco
                setTimeout(() => {
                    focusOnElement(focusedElementType, focusedElementId);
                }, 500); // Pequeno atraso para garantir que os elementos foram renderizados
            }
        }
    }
}

// Função para mostrar opções de exportação PDF
function showExportPdfOptions() {
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h3 class="modal-title">Exportar para PDF</h3>
        
        <div class="export-options">
            <div class="export-option">
                <input type="radio" id="export-all" name="export-type" value="all" checked>
                <div class="export-option-label">
                    <div class="export-option-title">Exportar tudo</div>
                    <div class="export-option-description">Todas as pastas, colunas e tarefas serão incluídas no PDF.</div>
                </div>
            </div>
            
            <div class="export-option">
                <input type="radio" id="export-folder" name="export-type" value="folder">
                <div class="export-option-label">
                    <div class="export-option-title">Exportar pasta específica</div>
                    <div class="export-option-description">Escolha uma pasta para exportar.</div>
                </div>
            </div>
            
            <div class="export-option">
                <input type="radio" id="export-filtered" name="export-type" value="filtered">
                <div class="export-option-label">
                    <div class="export-option-title">Exportar tarefas filtradas</div>
                    <div class="export-option-description">Apenas tarefas que correspondem ao filtro atual serão exportadas.</div>
                </div>
            </div>
        </div>
        
        <div id="folder-selection" style="display: none;">
            <div class="form-group">
                <label for="export-folder-select">Selecione a pasta:</label>
                <select id="export-folder-select" class="form-control">
                    ${folders.map(folder => `<option value="${folder.id}">${folder.title}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="export-settings">
            <h4>Configurações do PDF</h4>
            
            <div class="export-setting">
                <label for="pdf-title">Título do documento:</label>
                <input type="text" id="pdf-title" value="TaskFlow - Minhas Tarefas">
            </div>
            
            <div class="export-setting">
                <label for="pdf-orientation">Orientação:</label>
                <select id="pdf-orientation">
                    <option value="portrait">Retrato</option>
                    <option value="landscape">Paisagem</option>
                </select>
            </div>
            
            <div class="export-setting">
                <label for="pdf-include-header">Incluir cabeçalho:</label>
                <input type="checkbox" id="pdf-include-header" checked>
            </div>
            
            <div class="export-setting">
                <label for="pdf-include-date">Incluir data:</label>
                <input type="checkbox" id="pdf-include-date" checked>
            </div>
        </div>
        
        <div id="export-progress" class="export-progress">
            <p>Gerando PDF...</p>
            <div class="progress-bar-container">
                <div class="progress-bar-fill"></div>
            </div>
        </div>
        
        <div class="modal-actions">
            <button onclick="generatePdf()" class="comic-button primary-button">Exportar PDF</button>
            <button onclick="closeModal()" class="comic-button secondary-button">Cancelar</button>
        </div>
    `;
    
    // Adicionar evento para mostrar/ocultar seleção de pasta
    document.getElementById('export-folder').addEventListener('change', function() {
        document.getElementById('folder-selection').style.display = 'block';
    });
    
    document.getElementById('export-all').addEventListener('change', function() {
        document.getElementById('folder-selection').style.display = 'none';
    });
    
    document.getElementById('export-filtered').addEventListener('change', function() {
        document.getElementById('folder-selection').style.display = 'none';
    });
    
    openModal();
}

// Função para gerar o PDF
function generatePdf() {
    // Mostrar progresso
    const progressElement = document.getElementById('export-progress');
    const progressBar = document.querySelector('.progress-bar-fill');
    progressElement.style.display = 'block';
    progressBar.style.width = '10%';
    
    // Obter configurações
    const exportType = document.querySelector('input[name="export-type"]:checked').value;
    const selectedFolderId = exportType === 'folder' ? parseInt(document.getElementById('export-folder-select').value) : null;
    const pdfTitle = document.getElementById('pdf-title').value;
    const pdfOrientation = document.getElementById('pdf-orientation').value;
    const includeHeader = document.getElementById('pdf-include-header').checked;
    const includeDate = document.getElementById('pdf-include-date').checked;
    
    // Atualizar progresso
    progressBar.style.width = '20%';
    
    // Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: pdfOrientation,
        unit: 'mm',
        format: 'a4'
    });
    
    // Definir cores e estilos
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    
    // Adicionar cabeçalho
    if (includeHeader) {
        doc.setFontSize(22);
        doc.setTextColor(primaryColor);
        doc.text(pdfTitle, 14, 20);
        
        if (includeDate) {
            doc.setFontSize(10);
            doc.setTextColor(textColor);
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 27);
        }
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(primaryColor);
        doc.line(14, 30, doc.internal.pageSize.getWidth() - 14, 30);
    }
    
    // Atualizar progresso
    progressBar.style.width = '40%';
    
    // Preparar dados para o PDF
    let pdfData = [];
    let startY = includeHeader ? 40 : 14;
    
    // Função para adicionar uma pasta ao PDF
    function addFolderToPdf(folder) {
        // Adicionar título da pasta
        doc.setFontSize(16);
        doc.setTextColor(primaryColor);
        doc.text(`Pasta: ${folder.title}`, 14, startY);
        startY += 8;
        
        // Para cada coluna na pasta
        folder.columns.forEach(column => {
            // Adicionar título da coluna
            doc.setFontSize(14);
            doc.setTextColor(secondaryColor);
            doc.text(`Coluna: ${column.title}`, 14, startY);
            startY += 7;
            
            // Verificar se há tarefas
            if (column.tasks.length === 0) {
                doc.setFontSize(10);
                doc.setTextColor(textColor);
                doc.text('Nenhuma tarefa nesta coluna', 14, startY);
                startY += 7;
        return;
    }

            // Preparar dados para a tabela de tarefas
            const tableData = [];
            const tableColumns = [
                { header: 'Tarefa', dataKey: 'title' },
                { header: 'Prioridade', dataKey: 'priority' },
                { header: 'Data', dataKey: 'date' },
                { header: 'Status', dataKey: 'status' }
            ];
            
            // Adicionar tarefas à tabela
            column.tasks.forEach(task => {
                // Verificar se a tarefa deve ser incluída (para filtros)
                if (exportType === 'filtered') {
                    const isVisible = isTaskVisibleWithCurrentFilter(task);
                    if (!isVisible) return;
                }
                
                tableData.push({
                    title: task.title,
                    priority: getPriorityLabel(task.priority),
                    date: task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : '-',
                    status: task.completed ? 'Concluída' : 'Pendente'
                });
            });
            
            // Adicionar tabela ao PDF
            if (tableData.length > 0) {
                doc.autoTable({
                    startY: startY,
                    head: [tableColumns.map(col => col.header)],
                    body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
                    theme: 'grid',
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: '#ffffff',
                        fontStyle: 'bold'
                    },
                    alternateRowStyles: {
                        fillColor: '#f8f9fa'
                    },
                    styles: {
                        fontSize: 10,
                        cellPadding: 3
                    }
                });
                
                startY = doc.lastAutoTable.finalY + 10;
        } else {
                doc.setFontSize(10);
                doc.setTextColor(textColor);
                doc.text('Nenhuma tarefa corresponde aos filtros atuais', 14, startY);
                startY += 7;
            }
            
            // Verificar se precisa adicionar nova página
            if (startY > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                startY = 14;
            }
        });
        
        // Adicionar espaço após a pasta
        startY += 10;
        
        // Verificar se precisa adicionar nova página
        if (startY > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            startY = 14;
        }
    }
    
    // Função para verificar se uma tarefa está visível com o filtro atual
    function isTaskVisibleWithCurrentFilter(task) {
        const activeFilter = document.querySelector('.filter-button.active').dataset.filter;
        
        switch (activeFilter) {
            case 'all':
                return true;
            case 'pending':
                return !task.completed;
            case 'completed':
                return task.completed;
            case 'overdue':
                return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            default:
                return true;
        }
    }
    
    // Atualizar progresso
    progressBar.style.width = '60%';
    
    // Adicionar pastas ao PDF com base no tipo de exportação
    if (exportType === 'all') {
        // Exportar todas as pastas
        folders.forEach(folder => {
            addFolderToPdf(folder);
        });
    } else if (exportType === 'folder') {
        // Exportar pasta específica
        const folder = folders.find(f => f.id === selectedFolderId);
        if (folder) {
            addFolderToPdf(folder);
        }
    } else if (exportType === 'filtered') {
        // Exportar todas as pastas, mas apenas tarefas filtradas
        folders.forEach(folder => {
            addFolderToPdf(folder);
        });
    }
    
    // Atualizar progresso
    progressBar.style.width = '80%';
    
    // Adicionar rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(textColor);
        doc.text(`TaskFlow - Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    // Atualizar progresso
    progressBar.style.width = '100%';
    
    // Salvar o PDF
    setTimeout(() => {
        doc.save(`${pdfTitle.replace(/\s+/g, '_')}.pdf`);
        closeModal();
    }, 500);
}

// Função para mostrar o seletor de temas
function showThemeSelector() {
    const modalBody = document.getElementById('modal-body');
    
    // Criar HTML para as opções de tema
    let themesHTML = '';
    
    // Adicionar temas predefinidos
    Object.keys(predefinedThemes).forEach(themeKey => {
        const theme = predefinedThemes[themeKey];
        const isActive = currentTheme === themeKey && !customTheme;
        
        themesHTML += `
            <div class="theme-option ${isActive ? 'active' : ''} theme-${themeKey}" onclick="applyTheme('${themeKey}')">
                <div class="theme-preview">
                    <div class="theme-preview-header">
                        <div class="theme-preview-toggle"></div>
                    </div>
                    <div class="theme-preview-body">
                        <div class="theme-preview-card"></div>
                        <div class="theme-preview-card"></div>
                    </div>
                </div>
                <div class="theme-name">${theme.name}</div>
            </div>
        `;
    });
    
    // Adicionar tema personalizado se existir
    if (customTheme) {
        themesHTML += `
            <div class="theme-option active theme-custom" onclick="applyCustomTheme()">
                <div class="theme-preview" style="
                    --preview-bg: ${customTheme.bgColor};
                    --preview-card: ${customTheme.cardBg};
                    --preview-border: ${customTheme.borderColor};
                ">
                    <div class="theme-preview-header" style="background-color: ${customTheme.bgColor}">
                        <div class="theme-preview-toggle" style="background-color: ${customTheme.cardBg}; border-color: ${customTheme.borderColor}"></div>
                    </div>
                    <div class="theme-preview-body" style="background-color: ${customTheme.bgColor}">
                        <div class="theme-preview-card" style="background-color: ${customTheme.cardBg}; border-color: ${customTheme.borderColor}"></div>
                        <div class="theme-preview-card" style="background-color: ${customTheme.cardBg}; border-color: ${customTheme.borderColor}"></div>
                    </div>
                </div>
                <div class="theme-name">Personalizado</div>
            </div>
        `;
    }
    
    // Criar HTML para o seletor de cores personalizado
    const customColorPickers = `
        <div class="custom-theme-section">
            <h4>Personalizar Cores</h4>
            <div class="color-pickers">
                <div class="color-picker">
                    <label for="primary-color">Cor Primária</label>
                    <input type="color" id="primary-color" value="${customTheme ? customTheme.primaryColor : predefinedThemes[currentTheme].colors.primaryColor}">
                </div>
                <div class="color-picker">
                    <label for="secondary-color">Cor Secundária</label>
                    <input type="color" id="secondary-color" value="${customTheme ? customTheme.secondaryColor : predefinedThemes[currentTheme].colors.secondaryColor}">
                </div>
                <div class="color-picker">
                    <label for="accent-color">Cor de Destaque</label>
                    <input type="color" id="accent-color" value="${customTheme ? customTheme.accentColor : predefinedThemes[currentTheme].colors.accentColor}">
                </div>
                <div class="color-picker">
                    <label for="success-color">Cor de Sucesso</label>
                    <input type="color" id="success-color" value="${customTheme ? customTheme.successColor : predefinedThemes[currentTheme].colors.successColor}">
                </div>
                <div class="color-picker">
                    <label for="warning-color">Cor de Aviso</label>
                    <input type="color" id="warning-color" value="${customTheme ? customTheme.warningColor : predefinedThemes[currentTheme].colors.warningColor}">
                </div>
                <div class="color-picker">
                    <label for="bg-color">Cor de Fundo</label>
                    <input type="color" id="bg-color" value="${customTheme ? customTheme.bgColor : predefinedThemes[currentTheme].colors.bgColor}">
                </div>
                <div class="color-picker">
                    <label for="card-bg">Cor dos Cartões</label>
                    <input type="color" id="card-bg" value="${customTheme ? customTheme.cardBg : predefinedThemes[currentTheme].colors.cardBg}">
                </div>
                <div class="color-picker">
                    <label for="text-color">Cor do Texto</label>
                    <input type="color" id="text-color" value="${customTheme ? customTheme.textColor : predefinedThemes[currentTheme].colors.textColor}">
                </div>
                <div class="color-picker">
                    <label for="text-secondary">Cor do Texto Secundário</label>
                    <input type="color" id="text-secondary" value="${customTheme ? customTheme.textSecondary : predefinedThemes[currentTheme].colors.textSecondary}">
                </div>
                <div class="color-picker">
                    <label for="border-color">Cor da Borda</label>
                    <input type="color" id="border-color" value="${customTheme ? customTheme.borderColor : predefinedThemes[currentTheme].colors.borderColor}">
                </div>
                <div class="color-picker">
                    <label for="border-light">Cor da Borda Clara</label>
                    <input type="color" id="border-light" value="${customTheme ? customTheme.borderLight : predefinedThemes[currentTheme].colors.borderLight}">
                </div>
            </div>
            <div class="modal-actions">
                <button onclick="createCustomTheme()" class="comic-button primary-button">Aplicar Cores Personalizadas</button>
                <button onclick="resetCustomTheme()" class="comic-button secondary-button">Resetar</button>
            </div>
        </div>
    `;
    
    // Montar o HTML completo do modal
    modalBody.innerHTML = `
        <h3 class="modal-title">Personalizar Tema</h3>
        <div class="theme-selector">
            <h3>Temas Predefinidos</h3>
            <div class="theme-options">
                ${themesHTML}
            </div>
            ${customColorPickers}
        </div>
    `;
    
    openModal();
}

// Função para aplicar um tema predefinido
function applyTheme(themeKey) {
    if (!predefinedThemes[themeKey]) return;
    
    currentTheme = themeKey;
    customTheme = null;
    
    const theme = predefinedThemes[themeKey];
    const colors = theme.colors;
    
    // Aplicar cores ao :root
    document.documentElement.style.setProperty('--primary-color', colors.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', colors.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', colors.accentColor);
    document.documentElement.style.setProperty('--success-color', colors.successColor);
    document.documentElement.style.setProperty('--warning-color', colors.warningColor);
    document.documentElement.style.setProperty('--bg-color', colors.bgColor);
    document.documentElement.style.setProperty('--card-bg', colors.cardBg);
    document.documentElement.style.setProperty('--text-color', colors.textColor);
    document.documentElement.style.setProperty('--text-secondary', colors.textSecondary);
    document.documentElement.style.setProperty('--border-color', colors.borderColor);
    document.documentElement.style.setProperty('--border-light', colors.borderLight);
    
    // Salvar preferência
    saveThemePreference();
    
    // Atualizar seleção visual
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const selectedOption = document.querySelector(`.theme-${themeKey}`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }
}

// Função para criar e aplicar um tema personalizado
function createCustomTheme() {
    customTheme = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        accentColor: document.getElementById('accent-color').value,
        successColor: document.getElementById('success-color').value,
        warningColor: document.getElementById('warning-color').value,
        bgColor: document.getElementById('bg-color').value,
        cardBg: document.getElementById('card-bg').value,
        textColor: document.getElementById('text-color').value,
        textSecondary: document.getElementById('text-secondary').value,
        borderColor: document.getElementById('border-color').value,
        borderLight: document.getElementById('border-light').value
    };
    
    // Aplicar cores ao :root
    document.documentElement.style.setProperty('--primary-color', customTheme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', customTheme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', customTheme.accentColor);
    document.documentElement.style.setProperty('--success-color', customTheme.successColor);
    document.documentElement.style.setProperty('--warning-color', customTheme.warningColor);
    document.documentElement.style.setProperty('--bg-color', customTheme.bgColor);
    document.documentElement.style.setProperty('--card-bg', customTheme.cardBg);
    document.documentElement.style.setProperty('--text-color', customTheme.textColor);
    document.documentElement.style.setProperty('--text-secondary', customTheme.textSecondary);
    document.documentElement.style.setProperty('--border-color', customTheme.borderColor);
    document.documentElement.style.setProperty('--border-light', customTheme.borderLight);
    
    // Salvar preferência
    saveThemePreference();
    
    // Fechar o modal
    closeModal();
    
    // Mostrar mensagem de sucesso
    showThemeAppliedMessage();
}

// Função para aplicar o tema personalizado salvo
function applyCustomTheme() {
    if (!customTheme) return;
    
    // Aplicar cores ao :root
    document.documentElement.style.setProperty('--primary-color', customTheme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', customTheme.secondaryColor);
    document.documentElement.style.setProperty('--accent-color', customTheme.accentColor);
    document.documentElement.style.setProperty('--success-color', customTheme.successColor);
    document.documentElement.style.setProperty('--warning-color', customTheme.warningColor);
    document.documentElement.style.setProperty('--bg-color', customTheme.bgColor);
    document.documentElement.style.setProperty('--card-bg', customTheme.cardBg);
    document.documentElement.style.setProperty('--text-color', customTheme.textColor);
    document.documentElement.style.setProperty('--text-secondary', customTheme.textSecondary);
    document.documentElement.style.setProperty('--border-color', customTheme.borderColor);
    document.documentElement.style.setProperty('--border-light', customTheme.borderLight);
    
    // Atualizar seleção visual
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('active');
    });
    
    const customOption = document.querySelector('.theme-custom');
    if (customOption) {
        customOption.classList.add('active');
    }
}

// Função para resetar o tema personalizado
function resetCustomTheme() {
    customTheme = null;
    applyTheme(currentTheme);
    showThemeSelector(); // Reabrir o seletor de temas
}

// Função para mostrar mensagem de tema aplicado
function showThemeAppliedMessage() {
    const message = document.createElement('div');
    message.className = 'focus-notification';
    message.innerHTML = `
        <span>Tema personalizado aplicado com sucesso!</span>
    `;
    
    document.body.appendChild(message);
    
    // Remover a mensagem após 3 segundos
    setTimeout(() => {
        message.style.opacity = '0';
        message.style.transform = 'translate(-50%, 100px)';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
}