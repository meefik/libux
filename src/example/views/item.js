import css from 'todomvc-app-css/index.css';
import { Component } from 'libux';

export default class ItemView extends Component {
  get className () {
    return ['completed', 'hidden', 'editing']
      .map(k => this.state[k] ? css[k] : '').join(' ');
  }

  template () {
    return {
      default: `
      <li class="<%= this.className %>">
        <div class="${css.view}">
          <input class="${css.toggle}" type="checkbox" <%= this.state.completed?'checked':'' %>>
          <label><%- this.state.text %></label>
          <button class="${css.destroy}"></button>
        </div>
      </li>
      `,
      input: `
      <input class="${css.edit}" value="<%- this.state.text %>">
      `
    };
  }

  data () {
    return {
      completed: false,
      hidden: false,
      editing: false,
      text: '',
      ...super.data()
    };
  }

  events () {
    return [
      ...super.events(),
      {
        updated (path, newv, oldv) {
          this.el.className = this.className;
          this.$(css.toggle).checked = !!this.state.completed;
          if (this.state.editing) {
            const input = this.render('input');
            this.el.appendChild(input);
            input.focus();
          } else {
            this.$(css.view).querySelector('label').innerText = this.state.text;
            this.$(css.edit)?.remove();
          }
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
      }
    ];
  }
}
