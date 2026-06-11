import { RouterProvider } from 'react-router-dom';

import { appRouter } from './routes/router';

/**
 * Mounts the application router so route configuration controls the rendered page.
 *
 * @returns {JSX.Element} Router provider for the Smart Job Tracker frontend.
 */
function App() {
  return <RouterProvider router={appRouter} />;
}

export default App;
