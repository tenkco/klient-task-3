//корневой компонент
Vue.component('app', {
    template: `
        <div class="appContainer">
            <h1>Kanban доска задач</h1>
            
            <div class="columns">
                <column 
                    column-index="1"
                    title="Запланированные задачи">
                </column>
                
                <column 
                    column-index="2"
                    title="Задачи в работе">
                </column>
                
                <column 
                    column-index="3"
                    title="Тестирование">
                </column>
                
                <column 
                    column-index="4"
                    title="Выполненные задачи">
                </column>
            </div>
        </div>
    `
});

//колонки
Vue.component('column', {
    props: {
        columnIndex: String,
        title: String
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
            </div>
        </div>
    `,
    methods: {
        createTask(taskData) {
            this.$emit('create-task', taskData);
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