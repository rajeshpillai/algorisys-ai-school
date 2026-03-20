import { render } from 'solid-js/web';
import App from './app';
import './global.css';
import 'katex/dist/katex.min.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

render(() => <App />, root);
