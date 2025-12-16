import { createBrowserRouter, RouterProvider } from 'react-router'
import { View } from './views/View'
import { Edit } from './views/Edit'

const router = createBrowserRouter([
  {
    path: '/view',
    Component: View,
  },
  {
    path: '/edit',
    Component: Edit,
  },
])

export function App() {
  return <RouterProvider router={router} />
}

