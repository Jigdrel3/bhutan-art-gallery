import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  onAuthChange,
  signIn,
  signOut,
  listCategoriesWithImages,
  createCategory,
  uploadImage,
  setCover,
  updateImageMeta,
  deleteImage,
} from './adminData'
import { slugify } from './lib/slugify'
import { hasSupabase } from './lib/supabaseClient'
import './Admin.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <form onSubmit={handleSubmit}>
        <h1>Gallery Admin</h1>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

function PendingFileRow({ file, meta, onChange, onCoverSelect, isCover }) {
  const preview = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(preview), [preview])

  return (
    <div className="pending-row">
      <img src={preview} alt="" className="pending-thumb" />
      <div className="pending-fields">
        <span className="pending-name">{file.name}</span>
        <input
          type="text"
          placeholder="Caption (optional)"
          value={meta.caption}
          onChange={(e) => onChange({ ...meta, caption: e.target.value })}
        />
        <input
          type="text"
          placeholder="Alt text (optional)"
          value={meta.altText}
          onChange={(e) => onChange({ ...meta, altText: e.target.value })}
        />
      </div>
      <label className="pending-cover">
        <input type="radio" name="cover" checked={isCover} onChange={onCoverSelect} />
        cover
      </label>
    </div>
  )
}

function ExistingImageRow({ image, category, categories, onSetCover, onSave, onDelete }) {
  const [caption, setCaption] = useState(image.caption || '')
  const [altText, setAltText] = useState(image.alt_text || '')
  const [categoryId, setCategoryId] = useState(category.id)
  const [saving, setSaving] = useState(false)
  const dirty = caption !== (image.caption || '') || altText !== (image.alt_text || '') || categoryId !== category.id

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(image, { caption, altText, categoryId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="existing-row">
      <img src={image.url} alt={image.alt_text || ''} className="existing-thumb" />
      <div className="existing-fields">
        <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" />
        <input value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Alt text" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      <div className="existing-actions">
        {image.is_cover ? (
          <span className="cover-badge">cover</span>
        ) : (
          <button type="button" onClick={() => onSetCover(image)}>
            Set cover
          </button>
        )}
        <button type="button" disabled={!dirty || saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="danger" onClick={() => onDelete(image)}>
          Delete
        </button>
      </div>
    </div>
  )
}

function AdminPanel() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryTitle, setNewCategoryTitle] = useState('')
  const [pending, setPending] = useState([]) // { file, caption, altText }
  const [coverIndex, setCoverIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [status, setStatus] = useState('')
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    const rows = await listCategoriesWithImages()
    setCategories(rows)
    setLoading(false)
    setSelectedCategoryId((prev) => prev || (rows[0] && rows[0].id) || '')
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const addFiles = (fileList) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    setPending((prev) => [...prev, ...files.map((file) => ({ file, caption: '', altText: '' }))])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const clearPending = () => {
    setPending([])
    setCoverIndex(0)
  }

  const handleUpload = async () => {
    if (pending.length === 0) return
    setStatus('')
    setUploading(true)
    try {
      let categoryId = selectedCategoryId
      let categorySlug = categories.find((c) => c.id === selectedCategoryId)?.slug

      if (newCategoryTitle.trim()) {
        const slug = slugify(newCategoryTitle)
        const created = await createCategory({ slug, title: newCategoryTitle.trim() })
        categoryId = created.id
        categorySlug = created.slug
      }

      if (!categoryId) {
        setStatus('Pick or create a category first.')
        setUploading(false)
        return
      }

      const existingCount = categories.find((c) => c.id === categoryId)?.images.length || 0

      for (const [i, item] of pending.entries()) {
        setUploadProgress(`${i + 1} / ${pending.length}`)
        await uploadImage({
          categoryId,
          categorySlug,
          file: item.file,
          caption: item.caption,
          altText: item.altText,
          isCover: i === coverIndex,
          sortOrder: existingCount + i,
        })
      }

      setStatus(`Uploaded ${pending.length} image${pending.length > 1 ? 's' : ''}.`)
      clearPending()
      setNewCategoryTitle('')
      setSelectedCategoryId(categoryId)
      await reload()
    } catch (err) {
      setStatus(`Upload failed: ${err.message || err}`)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const handleSetCover = async (categoryId, image) => {
    await setCover(categoryId, image)
    await reload()
  }

  const handleSaveMeta = async (image, patch) => {
    await updateImageMeta(image.id, patch)
    await reload()
  }

  const handleDeleteImage = async (categoryId, image) => {
    if (!window.confirm('Delete this image? This cannot be undone.')) return
    await deleteImage(image, categoryId)
    await reload()
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Gallery Admin</h1>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <section className="admin-section">
        <h2>Upload images</h2>

        <div className="upload-controls">
          <label>
            Category
            <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.images.length})
                </option>
              ))}
            </select>
          </label>
          <label>
            Or new category
            <input
              type="text"
              placeholder="e.g. Rain"
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
            />
          </label>
        </div>

        <div
          className={`dropzone ${dragOver ? 'dropzone-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          Drag images here, or click to choose files
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {pending.length > 0 && (
          <div className="pending-list">
            {pending.map((item, i) => (
              <PendingFileRow
                key={i}
                file={item.file}
                meta={item}
                isCover={i === coverIndex}
                onCoverSelect={() => setCoverIndex(i)}
                onChange={(next) => setPending((prev) => prev.map((p, idx) => (idx === i ? next : p)))}
              />
            ))}
            <div className="pending-actions">
              <button type="button" onClick={clearPending} disabled={uploading}>
                Clear
              </button>
              <button type="button" onClick={handleUpload} disabled={uploading}>
                {uploading ? `Uploading ${uploadProgress}…` : `Upload ${pending.length} image${pending.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}

        {status && <p className="admin-status">{status}</p>}
      </section>

      <section className="admin-section">
        <h2>Manage images{selectedCategory ? ` — ${selectedCategory.title}` : ''}</h2>
        {loading && <p>Loading…</p>}
        {!loading && selectedCategory && selectedCategory.images.length === 0 && <p>No images yet.</p>}
        {!loading && selectedCategory && (
          <div className="existing-list">
            {selectedCategory.images.map((image) => (
              <ExistingImageRow
                key={image.id}
                image={image}
                category={selectedCategory}
                categories={categories}
                onSetCover={(img) => handleSetCover(selectedCategory.id, img)}
                onSave={handleSaveMeta}
                onDelete={(img) => handleDeleteImage(selectedCategory.id, img)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    if (!hasSupabase) return undefined
    return onAuthChange(setSession)
  }, [])

  if (!hasSupabase) {
    return (
      <div className="admin-login">
        <p>Supabase isn't configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).</p>
      </div>
    )
  }

  if (session === undefined) return <div className="admin-login">Loading…</div>
  return session ? <AdminPanel /> : <LoginForm />
}
