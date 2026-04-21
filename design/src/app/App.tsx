import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function App() {
  return (
    <div className="size-full overflow-hidden" style={{ fontFamily: 'var(--font-body)' }}>
      <RouterProvider router={router} />
    </div>
  );
}