import { startRust } from './rust/runtime';

void startRust().then(() => import('./app-entry')).catch(() => {
  document.getElementById('root')!.textContent = 'Impossible de démarrer Cyberstream. Vérifiez la mise à jour de votre WebView Android puis relancez l’application.';
});
