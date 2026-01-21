import { Router, Route } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import Home from '@/pages/Home';
import Editor from '@/pages/Editor';
import Display from '@/pages/Display';
import WorkoutManager from '@/pages/WorkoutManager';
import PDFImport from '@/pages/PDFImport';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Route path="/" component={Home} />
        <Route path="/editor" component={Editor} />
        <Route path="/display" component={Display} />
        <Route path="/manager" component={WorkoutManager} />
        <Route path="/import-pdf" component={PDFImport} />
      </Router>
    </ThemeProvider>
  );
}