import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { UploadPage } from './pages/UploadPage'
import { FilesPage } from './pages/FilesPage'
import { FileDetailsPage } from './pages/FileDetailsPage'

export default function App() {
  return <BrowserRouter><Routes>
    <Route element={<AppShell />}>
      <Route index element={<Dashboard />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="files" element={<FilesPage />} />
      <Route path="files/:id" element={<FileDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></BrowserRouter>
}
