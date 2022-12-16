import { HashRouter } from 'libux';
import TodoView from 'views/todo';

const router = new HashRouter({
  routes: {
    '#/': TodoView
  }
});

export default function (...args) {
  return router.show(...args);
}
