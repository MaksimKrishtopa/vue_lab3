Vue.component('task-card', {
  props: ['task'],
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

    isInDoneColumn() {
      return this.$parent.title === 'Done';
    },

    isInPlannedColumn() {
      return this.$parent.title === 'Planned Tasks';
    },
  },
  template: `
  <div class="task-card">
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
// Обновленный компонент для формы создания задачи
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
          lastEdited: new Date().toLocaleString(), // Временной штамп создания
        });

        // Очистка полей после создания задачи
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

// Обновленный компонент для первого столбца
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
          @return-to-in-progress="returnToInProgress"
        />
      </div>
    </div>
  `,
});





new Vue({
  el: '#app',
  template: '<kanban-board />',
});
