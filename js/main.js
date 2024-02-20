Vue.component('task-card', {
  props: ['task', 'selectedTaskId', 'isFoundTask'],
  data() {
    return {
      isEditing: false,
      editedTitle: '',
      editedDescription: '',
      editedDeadline: '',
      isReturning: false,
      returnReason: '',
    };
  },
  methods: {
    startEditing() {
      if (!this.isInDoneColumn) {
        this.isEditing = true;
        this.editedTitle = this.task.title;
        this.editedDescription = this.task.description;
        this.editedDeadline = this.task.deadline;
      }
    },
    saveChanges() {
      this.$emit('update-task', {
        id: this.task.id,
        title: this.editedTitle,
        description: this.editedDescription,
        deadline: this.editedDeadline,
        lastEdited: new Date().toLocaleString(),
      });
      this.isEditing = false;
    },
    cancelEditing() {
      this.isEditing = false;
    },
    deleteTask() {
      this.$emit('delete-task', this.task.id);
    },
    returnToInProgress() {
      if (this.returnReason.trim() === '') {
        alert('Please provide a return reason.');
        return;
      }
    
      this.$emit('return-to-in-progress', {
        task: this.task,
        returnReason: this.returnReason,
      });
    
      this.isReturning = false;
      this.returnReason = '';
    },
  },

  computed: {
    taskStatus() {
      const today = new Date();
      const deadlineDate = new Date(this.task.deadline);
  
      if (today > deadlineDate) {
        return 'overdue';
      } else {
        return 'onTime';
      }
    },

    isTaskFoundInSearch() {
      return this.$parent.selectedTaskId === this.task.id && this.$parent.filteredTasks.length > 0;
    },

    isInDoneColumn() {
      return this.$parent.title === 'Done';
    },

    isInPlannedColumn() {
      return this.$parent.title === 'Planned Tasks';
    },
  },

  template: `
    <div class="task-card" :class="{ 'selected-task': task.id === selectedTaskId, 'found-task': isFoundTask }">

      <div v-if="!isEditing">
        <h3 :class="{ 'overdue': taskStatus === 'overdue', 'on-time': taskStatus === 'onTime' }">{{ task.title }}</h3>
        <p>{{ task.description }}</p>
        <p>Deadline: {{ task.deadline }}</p>
        <p>Last Edited: {{ task.lastEdited }}</p>
        <p>Status: {{ taskStatus === 'overdue' ? 'Overdue' : 'On Time' }}</p>
        <button v-if="!isEditing && !isInDoneColumn" @click="startEditing">Edit</button>
        <button v-if="!isEditing && $parent.title !== 'In Progress' && $parent.title !== 'Testing' && $parent.title !== 'Done'" @click="deleteTask">Delete</button>

        <button v-if="!$parent.title || $parent.title === 'Planned Tasks'" @click="$emit('move-to-in-progress', task)">Move to In Progress</button>
        <button v-if="$parent.title === 'Testing' && !isReturning" @click="isReturning = true">Return to In Progress</button>
        <textarea v-if="isReturning" v-model="returnReason" placeholder="Return Reason"></textarea>
        <button v-if="isReturning" @click="returnToInProgress">Confirm Return</button>
      </div>
      <div v-else>
        <input v-model="editedTitle" placeholder="Title">
        <textarea v-model="editedDescription" placeholder="Description"></textarea>
        <input type="date" v-model="editedDeadline">
        <button @click="saveChanges">Save</button>
        <button @click="cancelEditing">Cancel</button>
      </div>
    </div>
  `,
});

Vue.component('add-task-form', {
  data() {
    return {
      newTaskTitle: '',
      newTaskDescription: '',
      newTaskDeadline: '',
    };
  },

  methods: {
    createTask() {
      if (this.newTaskTitle.trim() !== '') {
        this.$emit('create-task', {
          title: this.newTaskTitle,
          description: this.newTaskDescription,
          deadline: this.newTaskDeadline,
          lastEdited: new Date().toLocaleString(), 
        });

       
        this.newTaskTitle = '';
        this.newTaskDescription = '';
        this.newTaskDeadline = '';
      }
    },
  },

  template: `
    <div class="add-task-form">
      <input v-model="newTaskTitle" placeholder="Title">
      <textarea v-model="newTaskDescription" placeholder="Description"></textarea>
      <input type="date" v-model="newTaskDeadline">
      <button @click="createTask">Create Task</button>
    </div>
  `,
});


Vue.component('planned-tasks-column', {
  props: ['tasks'],
  methods: {
    createTask(newTask) {
      this.$emit('create-task', newTask);
    },
    deleteTask(taskId) {
      this.$emit('delete-task', taskId);
    },
  },
  template: `
    <div class="board-column">
      <h2>Planned Tasks</h2>
      <add-task-form @create-task="createTask" />
      <div v-for="task in tasks" :key="task.id">
        <task-card
          :task="task"
          @update-task="$emit('update-task', $event)"
          @move-to-in-progress="$emit('move-to-in-progress', $event)"
          @delete-task="deleteTask"
          @return-to-in-progress="returnToInProgress"/>
      </div>
    </div>
  `,
});

Vue.component('board-column', {
  props: ['title', 'tasks', 'selectedTaskId'],
  methods: {
    moveToTesting(task) {
      this.$emit('move-to-testing', task);
    },
    moveToDone(task) {
      this.$emit('move-to-done', task);
    },
    returnToInProgress(payload) {
      this.$emit('return-to-in-progress', payload);
    },
  },

  template: `
    <div class="board-column">
    <h2>{{ title }}</h2>
    <div v-for="task in tasks" :key="task.id">
      <task-card
        :task="task"
        @update-task="$emit('update-task', $event)"
        @move-to-in-progress="$emit('move-to-in-progress', $event)"
        @return-to-in-progress="returnToInProgress"/>
      <button v-if="title === 'In Progress'" @click="moveToTesting(task)">Move to Testing</button>
      <button v-if="title === 'Testing'" @click="moveToDone(task)">Move to Done</button>
    </div>
  </div>
    `,
});


Vue.component('kanban-board', {
  data() {
    return {
      plannedTasks: [],
      inProgressTasks: [],
      testingTasks: [],
      doneTasks: [],
      selectedTaskId: null,
    };
  },

  methods: {

    createTask(newTask) {
      this.plannedTasks.push({
        id: this.plannedTasks.length + 1,
        ...newTask,
      });
    },

    updateTask(updatedTask) {
      const index = this.plannedTasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        this.plannedTasks.splice(index, 1, updatedTask);
      }
    },

    moveToInProgress(task) {
      const index = this.plannedTasks.findIndex(t => t.id === task.id);
  
      if (index !== -1) {
        this.inProgressTasks.push(this.plannedTasks[index]);
        this.$delete(this.plannedTasks, index); 
      }
    },

    moveToTesting(task) {
      const index = this.inProgressTasks.findIndex(t => t.id === task.id);
    
      if (index !== -1) {
        this.testingTasks.push(this.inProgressTasks[index]);
        this.$delete(this.inProgressTasks, index);
      }
    },

    moveToDone(task) {
      const index = this.testingTasks.findIndex(t => t.id === task.id);
    
      if (index !== -1) {
        const today = new Date();
        const deadlineDate = new Date(task.deadline);
    
        if (today > deadlineDate) {
          task.status = 'overdue';
        } else {
          task.status = 'onTime';
        }
    
        this.doneTasks.push(task);
        this.$delete(this.testingTasks, index);
      }
    },
    

    deleteTask(taskId) {
      
      this.plannedTasks = this.plannedTasks.filter(task => task.id !== taskId);

    },

    returnToInProgress(payload) {
      const task = payload.task;
      const returnReason = payload.returnReason;
    
      if (this.testingTasks.some(t => t.id === task.id)) {
        if (returnReason.trim() !== '') {
          this.testingTasks = this.testingTasks.filter(t => t.id !== task.id);
          task.returnReason = returnReason;
          this.inProgressTasks.push(task);
        } else {
          alert('Please provide a return reason.');
        }
      }
    },

    selectTaskFromSearch(taskId) {
      this.selectedTaskId = taskId;
    },
    
    clearSelection() {
      this.selectedTaskId = null;
    },
  },
  template: `
  
  <div class="kanban-board">
  <search-bar @select-task="selectTaskFromSearch" @clear-selection="clearSelection" />
  <planned-tasks-column
    :tasks="plannedTasks"
    @update-task="updateTask"
    @move-to-in-progress="moveToInProgress"
    @create-task="createTask"
    @delete-task="deleteTask"/>
  <board-column
    title="In Progress"
    :tasks="inProgressTasks"
    @update-task="updateTask"
    @move-to-testing="moveToTesting"/>
  <board-column
  
    title="Testing"
    :tasks="testingTasks"
    @update-task="updateTask"
    @move-to-done="moveToDone"
    @return-to-in-progress="returnToInProgress"/>
  <board-column title="Done" :tasks="doneTasks"/>
</div>
  `,
});



Vue.component('search-bar', {
  data() {
    return {
      searchQuery: '',
      selectedTaskId: null,
    };
  },
  methods: {
    searchTasks() {
      this.selectedTaskId = null;
      this.$emit('clear-selection'); // Очищаем подсветку в родительском компоненте

      // Поиск в каждой колонке
      this.searchInColumn(this.$parent.plannedTasks);
      this.searchInColumn(this.$parent.inProgressTasks);
      this.searchInColumn(this.$parent.testingTasks);
      this.searchInColumn(this.$parent.doneTasks);
    },
    searchInColumn(column) {
      for (const task of column) {
        if (task.title.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          this.selectedTaskId = task.id;
          this.$emit('select-task', task.id); // Эмитируем выбранный идентификатор задачи в родительский компонент
          break; // Прерываем цикл при первом найденном элементе
        }
      }
    },
    clearSearch() {
      this.searchQuery = '';
      this.selectedTaskId = null;
      this.$emit('clear-selection'); // Очищаем подсветку в родительском компоненте
    },
    selectTask(task) {
      this.selectedTaskId = task.id;
      this.$emit('select-task', task.id); // Эмитируем выбранный идентификатор задачи в родительский компонент
    },
  },
  template: `
    <div class="search-bar">
      <input v-model="searchQuery" @input="searchTasks" placeholder="Search tasks">
      <div v-if="selectedTaskId !== null">
        <p>Found task:</p>
        <ul>
          <li v-for="task in $parent.plannedTasks.concat($parent.inProgressTasks, $parent.testingTasks, $parent.doneTasks)" 
              :key="task.id"
              @click="selectTask(task)">
            <task-card :task="task" :selectedTaskId="selectedTaskId" :isFoundTask="task.id === selectedTaskId && task.title.toLowerCase().includes(searchQuery.toLowerCase())" />
          </li>
        </ul>
        <button @click="clearSearch">Clear Search</button>
      </div>
    </div>
  `,
});




new Vue({
  el: '#app',
  template: '<kanban-board />',
});
