import { createBrowserRouter, RouterProvider } from 'react-router'
import { View } from './views/View'
import { Edit } from './views/Edit'
import { Web } from './views/Web'

const router = createBrowserRouter([
  {
    path: '/view',
    Component: View,
  },
  {
    path: '/edit',
    Component: Edit,
  },
  {
    path: '/example_sdk_app/*',
    Component: Web,
  },
])

export function App() {
  return <RouterProvider router={router} />
}

