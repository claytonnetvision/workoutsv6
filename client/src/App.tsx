import { Router, Route } from 'wouter';
import Home from '@/pages/Home';
import Editor from '@/pages/Editor';
import Display from '@/pages/Display';
import WorkoutManager from '@/pages/WorkoutManager';
import PDFImport from '@/pages/PDFImport';

export default function App() {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/editor" component={Editor} />
      <Route path="/display" component={Display} />
      <Route path="/manager" component={WorkoutManager} />
      <Route path="/import-pdf" component={PDFImport} />
    </Router>
  );
}
