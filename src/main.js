import TodoMVC from './App.svelte';

window.todomvc = new TodoMVC({
    target: document.querySelector('.app')
});
