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
            </div>
        </div>
    `
});

//экземпляр Vue
let app = new Vue({
    el: '#app'
});