import css from 'todomvc-app-css/index.css';
import { Component } from 'libux';

export default class ItemView extends Component {
  template () {
    return `
    <div class="${css.view}">
      <input class="${css.toggle}" type="checkbox" <%= state.completed?'checked':'' %>>
      <label><%= state.text %></label>
      <button class="${css.destroy}"></button>
    </div>
    <% if (state.editing) { %>
      <input class="${css.edit}" value="<%= state.text %>" >
    <% } %>
    `;
  }

  events () {
    return {
      rendered (el) {
        const className = [];
        if (this.state.completed) className.push(css.completed);
        if (this.state.editing) className.push(css.editing);
        if (this.state.hidden) className.push(css.hidden);
        el.className = className.join(' ');
        const input = this.$(css.edit, el);
        if (input) input.focus();
      },
      updated (path, newv, oldv) {
        this.render();
      },
      click: {
        [css.toggle]: (e, target) => {
          this.update('completed', target.checked);
        },
        [css.destroy]: (e, target) => {
          this.remove();
        }
      },
      dblclick: {
        [css.view]: (e, target) => {
          if (!this.state.completed) {
            this.update('editing', true);
          }
        }
      },
      keypress: {
        [css.edit]: (e, target) => {
          if (e.key === 'Enter') {
            target.blur();
          }
        }
      },
      blur: {
        [css.edit]: (e, target) => {
          this.update({
            editing: false,
            text: target.value
          });
        }
      }
    };
  }
}
