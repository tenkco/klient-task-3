//корневой компонент
Vue.component('app', {
    template: `
        <div class="appContainer">
            <h1>Kanban доска задач</h1>
            
            <div class="columns">
                <column 
                    column-index="1"
                    title="Запланированные задачи"
                    :tasks="tasks.column1"
                    @create-task="createTask"
                    @edit-task="editTask"
                    @delete-task="deleteTask"
                    @move-forward="moveForward">
                </column>
                
                <column 
                    column-index="2"
                    title="Задачи в работе"
                    :tasks="tasks.column2"
                    @edit-task="editTask"
                    @move-forward="moveForward"
                    @move-backward="moveBackward">
                </column>
                
                <column 
                    column-index="3"
                    title="Тестирование"
                    :tasks="tasks.column3"
                    @edit-task="editTask"
                    @move-forward="moveForward"
                    @move-backward="moveBackward">
                </column>
                
                <column 
                    column-index="4"
                    title="Выполненные задачи"
                    :tasks="tasks.column4">
                </column>
            </div>
        </div>
    `,
    data() {
        return {
            tasks: {
                column1: [],
                column2: [],
                column3: [],
                column4: []
            },
            nextId: 1
        };
    },

    mounted() {
        this.loadFromStorage();
    },

    methods: {
        loadFromStorage() {
            const saved = localStorage.getItem('kanbanTasks');
            if (saved) {
                const data = JSON.parse(saved);
                this.tasks = data.tasks || {
                    column1: [], column2: [], column3: [], column4: []
                };
                this.nextId = data.nextId || this.getNextId();
            }
        },

        saveToStorage() {
            const data = {
                tasks: this.tasks,
                nextId: this.nextId
            };
            localStorage.setItem('kanbanTasks', JSON.stringify(data));
        },

        getNextId() {
            let maxId = 0;
            for (let col in this.tasks) {
                this.tasks[col].forEach(task => {
                    if (task.id > maxId) maxId = task.id;
                });
            }
            return maxId + 1;
        },

        createTask(taskData) {
            const newTask = {
                id: this.nextId++,
                ...taskData,
                createdAt: new Date().toISOString(),
                editedAt: null,
                status: 'planned'
            };

            this.tasks.column1.push(newTask);
            this.saveToStorage();
        },

        editTask(data) {
            const { taskId, columnIndex, updatedTask } = data;
            const column = `column${columnIndex}`;
            const taskIndex = this.tasks[column].findIndex(t => t.id === taskId);

            if (taskIndex !== -1) {
                this.tasks[column].splice(taskIndex, 1, updatedTask);
                this.saveToStorage();
            }
        },

        deleteTask(data) {
            const { taskId, columnIndex } = data;
            const column = `column${columnIndex}`;
            const taskIndex = this.tasks[column].findIndex(t => t.id === taskId);

            if (taskIndex !== -1) {
                this.tasks[column].splice(taskIndex, 1);
                this.saveToStorage();
            }
        },

        moveForward(data) {
            const { taskId, fromColumn } = data;
            const fromCol = `column${fromColumn}`;
            const toCol = `column${parseInt(fromColumn) + 1}`;

            const taskIndex = this.tasks[fromCol].findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;

            const [movedTask] = this.tasks[fromCol].splice(taskIndex, 1);

            if (parseInt(fromColumn) + 1 === 4) {
                movedTask.completedAt = new Date().toISOString();
                movedTask.isOverdue = new Date(movedTask.deadline) < new Date();
                movedTask.isOnTime = !movedTask.isOverdue;
            }

            this.tasks[toCol].push(movedTask);
            this.saveToStorage();
        },

        moveBackward(data) {
            const { taskId, fromColumn } = data;

            const reason = prompt('Укажите причину возврата задачи:');
            if (!reason) return;

            const fromCol = `column${fromColumn}`;
            const toCol = `column${parseInt(fromColumn) - 1}`;

            const taskIndex = this.tasks[fromCol].findIndex(t => t.id === taskId);
            if (taskIndex === -1) return;

            const [movedTask] = this.tasks[fromCol].splice(taskIndex, 1);
            movedTask.returnReason = reason;
            movedTask.returnedAt = new Date().toISOString();

            this.tasks[toCol].push(movedTask);
            this.saveToStorage();
        }

    },
});

//колонки
Vue.component('column', {
    props: {
        columnIndex: String,
        title: String,
        tasks: Array
    },
    template: `
        <div class="column" :class="'column-' + columnIndex">
            <div class="columnHeader">
                <h2>{{ title }}</h2>
            </div>
            <div class="cardsContainer">
                <create-task-form 
                    v-if="columnIndex === '1'"
                    @create-task="createTask">
                </create-task-form>
                <task-card
                     v-for="task in tasks"
                     :key="task.id"
                     :task="task"
                     :column-index="columnIndex"
                     @edit-task="editTask"
                     @delete-task="deleteTask"
                     @move-forward="moveForward"
                     @move-backward="moveBackward">
                </task-card>
            </div>
            
        </div>
    `,
    methods: {
        createTask(taskData) {
            this.$emit('create-task', taskData);
        },
        editTask(data) {
            this.$emit('edit-task', data);
        },
        deleteTask(data) {
            this.$emit('delete-task', data);
        },
        moveForward(data) {
            this.$emit('move-forward', data);
        },
        moveBackward(data) {
            this.$emit('move-backward', data);
        }
    }
});

Vue.component('task-card', {
    props: {
        task: Object,
        columnIndex: String
    },
    template: `
        <div class="taskCard">
            <div v-if="!isEditing" class="taskHeader">
                <h3>{{ task.title }}</h3>
                <span class="taskDate">Создано: {{ formatDate(task.createdAt) }}</span>
                <span v-if="task.editedAt" class="taskDate">
                    (ред. {{ formatDate(task.editedAt) }})
                </span>
            </div>
            
            <div v-if="!isEditing">
                <p class="taskDescription">{{ task.description }}</p>
                <div class="taskFooter">
                    <span class="taskDeadline">Дедлайн: {{ formatDate(task.deadline) }}</span>
            </div>
                
                <div>
                    <div class="moveButtons">
                        <button 
                            v-if="canMoveForward" 
                            @click="moveForward" 
                            class="moveButton">Вперед</button>
                        <button 
                            v-if="canMoveBackward && columnIndex === '3'" 
                            @click="moveBackward" 
                            class="moveButton">Назад</button>
                    </div>
                    <button @click="startEditing" class="editButton">Редактировать</button>
                    <button @click="deleteTask" class="deleteButton" v-if="columnIndex === '1'">Удалить</button>
                </div>
                
                <div v-if="task.returnReason" class="returnInfo">
                    <span class="returnReason">Причина возврата: {{ task.returnReason }}</span>
                    <span class="returnDate">{{ formatDate(task.returnedAt) }}</span>
                </div>
                
                <div v-if="columnIndex === '4'" class="deadlineStatus">
                    <span :class="task.isOverdue ? 'overdue' : 'onTime'">
                        {{ task.isOverdue ? 'Просрочена' : 'Выполнена в срок' }}
                    </span>
                </div>
                
            </div>
            
            <div v-if="isEditing" class="editForm">
                <input 
                    v-model="editedTitle" 
                    class="editInput" 
                    placeholder="Заголовок">
                <textarea 
                    v-model="editedDescription" 
                    class="editInput" 
                    placeholder="Описание"></textarea>
                <input 
                    type="datetime-local" 
                    v-model="editedDeadline" 
                    class="editInput">
                <div class="editButtons">
                    <button @click="saveEdit" class="saveButton">Сохранить</button>
                    <button @click="cancelEdit" class="cancelButton">Отмена</button>
                </div>
            </div>
            
        </div>
    `,
    data() {
        return {
            isEditing: false,
            editedTitle: '',
            editedDescription: '',
            editedDeadline: ''
        };
    },

    computed: {
        canMoveForward() {
            return this.columnIndex === '1' || this.columnIndex === '2' ||
                (this.columnIndex === '3' && !this.isReturnReason);
        },
        canMoveBackward() {
            return this.columnIndex === '3';
        },
    },

    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        startEditing() {
            this.editedTitle = this.task.title;
            this.editedDescription = this.task.description;
            this.editedDeadline = this.task.deadline.slice(0, 16);
            this.isEditing = true;
        },
        saveEdit() {
            if (!this.editedTitle.trim() || !this.editedDescription.trim() || !this.editedDeadline) {
                return;
            }

            const updatedTask = {
                ...this.task,
                title: this.editedTitle,
                description: this.editedDescription,
                deadline: this.editedDeadline,
                editedAt: new Date().toISOString()
            };

            this.$emit('edit-task', {
                taskId: this.task.id,
                columnIndex: this.columnIndex,
                updatedTask: updatedTask
            });

            this.isEditing = false;
        },

        deleteTask() {
            if (confirm('Удалить задачу?')) {
                this.$emit('delete-task', {
                    taskId: this.task.id,
                    columnIndex: this.columnIndex
                });
            }
        },

        cancelEdit() {
            this.isEditing = false;
        },

        moveForward() {
            this.$emit('move-forward', {
                taskId: this.task.id,
                fromColumn: this.columnIndex
            });
        },
        moveBackward() {
            this.$emit('move-backward', {
                taskId: this.task.id,
                fromColumn: this.columnIndex
            });
        }
    }
});


//создание задачи
Vue.component('create-task-form', {
    template: `
        <div class="createTaskForm">
            <input 
                type="text" 
                v-model="title" 
                placeholder="Заголовок"
                class="taskInput">
            <textarea 
                v-model="description" 
                placeholder="Описание"
                class="taskInput"></textarea>
            <input 
                type="datetime-local" 
                v-model="deadline"
                class="taskInput">
            <button 
                @click="createTask"
                :disabled="!isValid"
                class="createButton">
                Создать
            </button>
        </div>
    `,
    data() {
        return {
            title: '',
            description: '',
            deadline: ''
        };
    },
    computed: {
        isValid() {
            return this.title.trim() && this.description.trim() && this.deadline;
        }
    },
    methods: {
        createTask() {
            if (!this.isValid) return;

            this.$emit('create-task', {
                title: this.title,
                description: this.description,
                deadline: this.deadline
            });

            this.title = '';
            this.description = '';
            this.deadline = '';
        }
    }
});

//экземпляр Vue
let app = new Vue({
    el: '#app'
});