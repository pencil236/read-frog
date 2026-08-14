import { Link, Route, Routes } from "react-router"
import { i18n } from "@/utils/i18n"
import { NotebaseDetailPage } from "./pages/notebase-detail"
import { NotebaseListPage } from "./pages/notebase-list"
import { StoragePage } from "./pages/storage"
import { ReviewSection } from "./review-section"
import { TemplatesSection } from "./templates-section"

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-4 border-b bg-background px-6 py-3">
        <Link to="/" className="font-semibold tracking-tight">
          {i18n.t("notebase.title")}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            {i18n.t("notebase.nav.notebases")}
          </Link>
          <Link to="/storage" className="hover:text-foreground">
            {i18n.t("notebase.nav.storage")}
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-6 py-6">
        <Routes>
          <Route path="/" element={<NotebaseListPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/notebases/:id" element={<NotebaseDetailPage />} />
          <Route path="/notebases/:id/templates" element={<TemplatesSection />} />
          <Route path="/notebases/:id/review" element={<ReviewSection />} />
        </Routes>
      </main>
    </div>
  )
}
