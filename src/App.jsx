import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, X, Check, Loader2, Trash2 } from 'lucide-react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('year', { ascending: true })
        .order('date', { ascending: true })
      if (error) throw error
      setBooks(data || [])
    } catch (e) {
      console.error('Load error:', e)
      showToast('데이터를 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  async function handleAddBook(newBook) {
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([newBook])
        .select()
      if (error) throw error
      setBooks([...books, ...data])
      setShowAddModal(false)
      showToast('책이 추가되었어요')
    } catch (e) {
      console.error('Insert error:', e)
      showToast('저장에 실패했어요')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteBook(id) {
    if (!confirm('정말 삭제할까요?')) return
    try {
      const { error } = await supabase.from('books').delete().eq('id', id)
      if (error) throw error
      setBooks(books.filter((b) => b.id !== id))
      showToast('삭제되었어요')
    } catch (e) {
      console.error('Delete error:', e)
      showToast('삭제에 실패했어요')
    }
  }

  const sortKey = (b) => {
    const parts = (b.date || `${b.year}`).split('.')
    const y = parseInt(parts[0]) || b.year || 0
    const m = parseInt(parts[1]) || 0
    const d = parseInt(parts[2]) || 0
    return y * 10000 + m * 100 + d
  }

  const sortedAll = useMemo(
    () => [...books].sort((a, b) => sortKey(b) - sortKey(a)),
    [books]
  )
  const ascSorted = useMemo(
    () => [...books].sort((a, b) => sortKey(a) - sortKey(b)),
    [books]
  )
  const numMap = useMemo(() => {
    const m = new Map()
    ascSorted.forEach((b, i) => m.set(b.id, String(i + 1).padStart(3, '0')))
    return m
  }, [ascSorted])

  const totalPages = useMemo(
    () => books.reduce((s, b) => s + (b.pages || 0), 0),
    [books]
  )

  const years = useMemo(
    () => [...new Set(sortedAll.map((b) => b.year))].filter(Boolean),
    [sortedAll]
  )

  const pickerCount = useMemo(() => {
    const c = {}
    books.forEach((b) => {
      if (!b.picker || b.picker === '다같이' || b.picker === '혜민혜선') return
      c[b.picker] = (c[b.picker] || 0) + 1
    })
    return c
  }, [books])

  const memberOrder = ['혜민', '민영', '혜선']
  const allMembers = useMemo(() => {
    const set = new Set(memberOrder)
    Object.keys(pickerCount).forEach((p) => set.add(p))
    return [...set]
  }, [pickerCount])

  const catCount = useMemo(() => {
    const c = {}
    books.forEach((b) => {
      if (!b.category) return
      c[b.category] = (c[b.category] || 0) + 1
    })
    return c
  }, [books])
  const catSorted = useMemo(
    () => Object.entries(catCount).sort((a, b) => b[1] - a[1]),
    [catCount]
  )
  const maxCatCount = catSorted.length > 0 ? catSorted[0][1] : 1

  const formatDate = (b) => {
    if (!b.date) return `${b.year}`
    const parts = b.date.split('.')
    if (parts.length >= 3) return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`
    if (parts.length === 2) return `${parts[0].slice(2)}.${parts[1]}`
    return b.date
  }

  const filteredYears = yearFilter === 'all' ? years : years.filter((y) => String(y) === yearFilter)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-4 flex justify-between items-center">
          <div className="text-sm font-semibold tracking-tight">쥬라기 독서모임</div>
          <div className="flex gap-5 sm:gap-7 items-center">
            <a href="#archive" className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 font-medium">아카이브</a>
            <a href="#members" className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 font-medium">멤버</a>
            <a href="#categories" className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 font-medium">분류</a>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-neutral-900 text-white text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full hover:bg-neutral-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">책 추가</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 sm:px-10">
        <header className="pt-20 sm:pt-24 pb-16">
          <div className="text-xs text-neutral-400 font-medium mb-5">2023 — {new Date().getFullYear()}</div>
          <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6">
            한 달에 한 권,<br />함께 읽은 책들
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-xl leading-relaxed">
            쥬라기 독서모임은 매달 한 권의 책을 함께 읽고 이야기 나눕니다. 우리가 펼쳤던 책들의 기록입니다.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-neutral-100 mb-20">
          <Stat label="읽은 책" value={books.length} unit="권" />
          <Stat label="총 페이지" value={totalPages.toLocaleString()} unit="p" />
          <Stat label="활동 기간" value={new Date().getFullYear() - 2022} unit="년" />
          <Stat label="멤버" value={allMembers.length} unit="명" />
        </div>

        <section id="archive" className="py-12">
          <div className="flex justify-between items-baseline flex-wrap gap-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">아카이브</h2>
            <div className="text-sm text-neutral-400">연도별로 보기</div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-8">
            <FilterPill active={yearFilter === 'all'} onClick={() => setYearFilter('all')}>전체</FilterPill>
            {[...years].reverse().map((yr) => (
              <FilterPill
                key={yr}
                active={yearFilter === String(yr)}
                onClick={() => setYearFilter(String(yr))}
              >
                {yr}
              </FilterPill>
            ))}
          </div>

          {[...filteredYears].reverse().map((yr) => {
            const yrBooks = sortedAll.filter((b) => b.year === yr)
            const yrPages = yrBooks.reduce((s, b) => s + (b.pages || 0), 0)
            return (
              <div key={yr} className="mb-14">
                <div className="flex justify-between items-baseline pb-3 border-b border-neutral-300 mb-3">
                  <div className="text-xl sm:text-2xl font-bold tracking-tight">{yr}</div>
                  <div className="text-xs sm:text-sm text-neutral-400">
                    {yrBooks.length}권 · {yrPages.toLocaleString()}p
                  </div>
                </div>
                {yrBooks.map((b) => (
                  <BookRow
                    key={b.id}
                    book={b}
                    num={numMap.get(b.id)}
                    formatDate={formatDate}
                    onDelete={() => handleDeleteBook(b.id)}
                  />
                ))}
              </div>
            )
          })}
        </section>

        <section id="members" className="py-12">
          <div className="flex justify-between items-baseline flex-wrap gap-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">멤버</h2>
            <div className="text-sm text-neutral-400">매달 한 사람이 책을 고릅니다</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allMembers.map((name, i) => (
              <div key={name} className="border border-neutral-200 rounded-xl p-6 hover:border-neutral-900 transition">
                <div className="text-lg font-bold tracking-tight">{name}</div>
                <div className="text-xs text-neutral-400 mb-6">멤버 {String(i + 1).padStart(2, '0')}</div>
                <div className="flex justify-between items-baseline pt-4 border-t border-neutral-100">
                  <span className="text-xs text-neutral-400">고른 책</span>
                  <span className="text-2xl font-bold tracking-tight">
                    {pickerCount[name] || 0}<span className="text-xs font-medium text-neutral-400 ml-0.5">권</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="categories" className="py-12">
          <div className="flex justify-between items-baseline flex-wrap gap-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">분류</h2>
            <div className="text-sm text-neutral-400">한국십진분류법 기준</div>
          </div>
          <div className="space-y-2.5">
            {catSorted.map(([name, count]) => (
              <div key={name} className="grid grid-cols-[100px_1fr_30px] gap-4 items-center">
                <div className="text-sm font-medium">{name}</div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(count / maxCatCount) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-neutral-500 text-right tabular-nums">{count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-neutral-100 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 flex justify-between text-xs text-neutral-400 flex-wrap gap-3">
          <span>쥬라기 독서모임</span>
          <span>모두가 함께 채워가는 기록</span>
        </div>
      </footer>

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddBook}
          saving={saving}
          existingMembers={allMembers}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div className="py-7 px-4 sm:px-6 border-r border-neutral-100 last:border-r-0 sm:[&:nth-child(2)]:border-r [&:nth-child(2)]:border-r-0">
      <div className="text-xs text-neutral-400 mb-2 font-medium">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight">
        {value}<span className="text-sm font-medium text-neutral-400 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-sm font-medium px-3.5 py-1.5 rounded-full border transition ${
        active
          ? 'bg-neutral-900 text-white border-neutral-900'
          : 'bg-transparent text-neutral-500 border-neutral-300 hover:text-neutral-900 hover:border-neutral-900'
      }`}
    >
      {children}
    </button>
  )
}

function BookRow({ book, num, formatDate, onDelete }) {
  return (
    <div className="group grid grid-cols-[1fr_auto] sm:grid-cols-[60px_90px_1fr_1.2fr_90px_70px_30px] gap-2 sm:gap-5 py-4 border-b border-neutral-100 items-center hover:bg-neutral-50 transition">
      <div className="hidden sm:block text-xs text-neutral-400 tabular-nums">{num}</div>
      <div className="text-xs text-neutral-500 tabular-nums sm:col-auto col-start-1 row-start-1">{formatDate(book)}</div>
      <div className="text-sm sm:text-[15px] font-semibold tracking-tight col-span-2 sm:col-auto sm:row-auto row-start-2">{book.title}</div>
      <div className="text-xs sm:text-sm text-neutral-500 col-start-1 row-start-3 sm:row-auto sm:col-auto">{book.author || '—'}</div>
      <div className="col-start-2 row-start-3 sm:row-auto sm:col-auto text-right sm:text-left">
        <span className="inline-block px-2 py-0.5 bg-neutral-100 rounded text-[11px] text-neutral-600">
          {book.category || '—'}
        </span>
      </div>
      <div className="text-xs sm:text-sm font-medium text-right col-start-2 row-start-1 sm:row-auto">
        {book.picker || '—'}
        <span className="block text-[11px] text-neutral-400 font-normal mt-0.5 tabular-nums">
          {book.pages ? `${book.pages}p` : '—'}
        </span>
      </div>
      <button
        onClick={onDelete}
        className="hidden sm:block text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
        title="삭제"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function AddBookModal({ onClose, onSubmit, saving, existingMembers }) {
  const today = new Date()
  const [form, setForm] = useState({
    date: `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`,
    title: '',
    author: '',
    pages: '',
    picker: '',
    category: '',
  })

  const categories = ['문학', '경제경영', '사회과학', '철학', '심리학', '예술', '역사', '인문', '기술과학', '자연과학', '의학', '언어', '종교']

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('책 제목을 입력해주세요')
      return
    }
    const dateParts = form.date.split('.')
    const year = parseInt(dateParts[0]) || today.getFullYear()
    const month = parseInt(dateParts[1]) || null

    onSubmit({
      year,
      date: form.date.trim(),
      month,
      picker: form.picker.trim(),
      title: form.title.trim(),
      author: form.author.trim(),
      pages: form.pages ? parseInt(form.pages) : null,
      category: form.category.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100">
          <h3 className="text-lg font-bold tracking-tight">새 책 추가</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="모임 날짜" hint="예: 2026.05.20">
            <input
              type="text"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              placeholder="YYYY.MM.DD"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition tabular-nums"
            />
          </Field>

          <Field label="책 제목" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 작별하지 않는다"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition"
              autoFocus
            />
          </Field>

          <Field label="저자">
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="예: 한강"
              className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="페이지">
              <input
                type="number"
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: e.target.value })}
                placeholder="예: 320"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition"
              />
            </Field>

            <Field label="고른 사람">
              <input
                type="text"
                value={form.picker}
                onChange={(e) => setForm({ ...form, picker: e.target.value })}
                placeholder="예: 혜민"
                list="member-list"
                className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-neutral-900 transition"
              />
              <datalist id="member-list">
                {existingMembers.map((m) => <option key={m} value={m} />)}
              </datalist>
            </Field>
          </div>

          <Field label="분류">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat })}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    form.category === cat
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-transparent text-neutral-500 border-neutral-200 hover:border-neutral-900 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            추가하기
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-neutral-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[11px] text-neutral-400">{hint}</span>}
      </label>
      {children}
    </div>
  )
}
