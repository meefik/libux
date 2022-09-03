import css from 'todomvc-app-css/index.css';
import { Component } from 'libux';
import { getItem, setItem } from 'store';
import t from 'locale';
import ItemView from 'views/item';

export default class TodoView extends Component {
  constructor (...args) {
    super(...args);
    this.mount(document.body);
  }

  template () {
    const filterClassName = (filter) => {
      return this.params.filter === filter ? css.selected : '';
    };
    return `
    <section class="${css.todoapp}">
      <header>
        <h1>${t('header')}</h1>
        <input class="${css['new-todo']}" placeholder="${t('new_todo')}" autofocus>
      </header>
      <section class="${css.main}">
        <input id="toggle-all" class="${css['toggle-all']}" type="checkbox">
        <label for="toggle-all">${t('toggle_all')}</label>
        <ul class="${css['todo-list']}"></ul>
        <footer class="${css.footer}">
          <span class="${css['todo-count']}"></span>
          <ul class="${css.filters}">
            <li><a href="#/?filter=all" class="${filterClassName('all')}">${t('filter.all')}</a></li>
            <li><a href="#/?filter=active" class="${filterClassName('active')}">${t('filter.active')}</a></li>
            <li><a href="#/?filter=completed" class="${filterClassName('completed')}">${t('filter.completed')}</a></li>
          </ul>
          <button class="${css['clear-completed']}">${t('clear_completed')}</button>
        </footer>
      </section>
    </section>
    <footer class="${css.info}">
      <p>${t('info.line1')}</p>
      <p>${t('info.line2')}</p>
    </footer>
    `;
  }

  data () {
    return {
      list: []
    };
  }

  events () {
    return [
      ...super.events(),
      {
        mounted () {
          this.state = {
            list: (getItem('todo') || []).map(state => this.createItem(state))
          };
        },
        updated (path, newv) {
          if (!path || /^list/.test(path)) {
            setItem('todo', this.state.list);
            const count = this.state.list.reduce((o, i) => (i.state.hidden ? o : o + 1), 0);
            this.$(css['todo-count']).innerText = count;
            this.$(css.footer).hidden = !this.state.list.length;
          }
        },
        added (path, newv, oldv) {
          this.dispatchEvent('updated', path, newv, oldv);
        },
        deleted (path, newv, oldv) {
          this.dispatchEvent('updated', path, newv, oldv);
        },
        changed (newv) {
          this.state.list.forEach(view => {
            const completed = view.state.completed;
            const hidden =
              (!completed && newv.filter === 'completed') ||
              (completed && newv.filter === 'active');
            view.update('hidden', hidden);
          });
          this.$(css.filters).querySelectorAll('a').forEach(node => {
            const url = new URL(node.href);
            node.className = url.hash === `#/?filter=${this.params.filter}` ? css.selected : '';
          });
        },
        keypress: {
          [css['new-todo']]: (e, target) => {
            if (e.key !== 'Enter') return;
            const text = target.value;
            if (text) {
              const itemView = this.createItem({ text });
              this.add('list', itemView);
            }
            target.value = '';
          }
        },
        click: {
          [css['toggle-all']]: (e, target) => {
            this.state.list.forEach(view => {
              view.update('completed', target.checked);
            });
          },
          [css['clear-completed']]: (e, target) => {
            this.state.list.forEach(view => {
              if (view.state.completed) {
                view.remove();
              }
            });
            location.hash = '#/?filter=all';
          }
        }
      }
    ];
  }

  createItem (state) {
    const itemView = new ItemView({
      container: this.$(css['todo-list']),
      state
    });
    itemView.on('removed', () => {
      const index = this.state.list.indexOf(itemView);
      if (index >= 0) {
        this.delete(`list.${index}`);
      }
    });
    itemView.on('updated', (path, newv, oldv) => {
      const index = this.state.list.indexOf(itemView);
      if (index >= 0) {
        this.dispatchEvent('updated', `list.${index}.${path}`, newv, oldv);
      }
    });
    return itemView;
  }
}
