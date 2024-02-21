Vue.component('task-card', {
  props: ['task', 'searchQuery'],
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
    searchTasks() {
      return (
        this.searchQuery.trim() === '' ||
        this.task.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
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
  <div class="task-card" :class="{ 'found-task': searchTasks() && searchQuery.trim() !== '' }">

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
  props: ['tasks', 'searchQuery'],
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
          @return-to-in-progress="returnToInProgress"
          :search-query="searchQuery"
        />
      </div>
    </div>
  `,
});
Vue.component('board-column', {
  props: ['title', 'tasks', 'selectedTaskId', 'searchQuery'],
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
          @return-to-in-progress="returnToInProgress"
          :search-query="searchQuery"
        />
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
      searchQuery: '',
    };
  },

  created() {
    
    this.loadTasksFromLocalStorage();
  },

  methods: {

    createTask(newTask) {
      this.plannedTasks.push({
        id: this.plannedTasks.length + 1,
        ...newTask,
      });
      this.saveTasksToLocalStorage(); 
    },

    updateTask(updatedTask) {
      const index = this.plannedTasks.findIndex(task => task.id === updatedTask.id);
      if (index !== -1) {
        this.plannedTasks.splice(index, 1, updatedTask);
      }
      this.saveTasksToLocalStorage();
    },

    moveToInProgress(task) {
      const index = this.plannedTasks.findIndex(t => t.id === task.id);
  
      if (index !== -1) {
        this.inProgressTasks.push(this.plannedTasks[index]);
        this.$delete(this.plannedTasks, index); 
      }
      this.saveTasksToLocalStorage();
    },

    moveToTesting(task) {
      const index = this.inProgressTasks.findIndex(t => t.id === task.id);
    
      if (index !== -1) {
        this.testingTasks.push(this.inProgressTasks[index]);
        this.$delete(this.inProgressTasks, index);
      }
      this.saveTasksToLocalStorage();
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
      this.saveTasksToLocalStorage();
    },
    

    deleteTask(taskId) {
      
      this.plannedTasks = this.plannedTasks.filter(task => task.id !== taskId);
      this.saveTasksToLocalStorage();
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
      this.saveTasksToLocalStorage();
    },

    searchTasks() {
      const allTasks = [...this.plannedTasks, ...this.inProgressTasks, ...this.testingTasks, ...this.doneTasks];
      const lowerCaseQuery = this.searchQuery.toLowerCase().trim();
    
      allTasks.forEach(task => {
        task.isFound = false; 
    
        for (const key in task) {
          if (key !== 'isFound' && typeof task[key] === 'string' && task[key].toLowerCase().includes(lowerCaseQuery)) {
            task.isFound = true;
            break;
          }
        }
      });
    },

    loadTasksFromLocalStorage() {
      
      const storedTasks = localStorage.getItem('kanbanTasks');
      if (storedTasks) {
        const { plannedTasks, inProgressTasks, testingTasks, doneTasks } = JSON.parse(storedTasks);
        this.plannedTasks = plannedTasks;
        this.inProgressTasks = inProgressTasks;
        this.testingTasks = testingTasks;
        this.doneTasks = doneTasks;
      }
    },

    saveTasksToLocalStorage() {
      
      localStorage.setItem('kanbanTasks', JSON.stringify({
        plannedTasks: this.plannedTasks,
        inProgressTasks: this.inProgressTasks,
        testingTasks: this.testingTasks,
        doneTasks: this.doneTasks,
      }));
    },

    mounted() {
      this.loadTasksFromLocalStorage();
    },
  
    beforeUpdate() {
      this.saveTasksToLocalStorage();
    },
    
  },
  template: `
  
  <div class="kanban-board">
  <div class="search-bar">
    <input v-model="searchQuery" @input="searchTasks" placeholder="Search tasks...">
  </div>
  <planned-tasks-column
    :tasks="plannedTasks"
    @update-task="updateTask"
    @move-to-in-progress="moveToInProgress"
    @create-task="createTask"
    @delete-task="deleteTask"
    :search-query="searchQuery"
  />
  <board-column
    title="In Progress"
    :tasks="inProgressTasks"
    @update-task="updateTask"
    @move-to-testing="moveToTesting"
    :search-query="searchQuery"
  />
  <board-column
    title="Testing"
    :tasks="testingTasks"
    @update-task="updateTask"
    @move-to-done="moveToDone"
    @return-to-in-progress="returnToInProgress"
    :search-query="searchQuery"
  />
  <board-column title="Done" :tasks="doneTasks" :search-query="searchQuery" />
</div>
  `,
});






new Vue({
  el: '#app',
  template: '<kanban-board />',
});