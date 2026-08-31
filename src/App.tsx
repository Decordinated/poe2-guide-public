import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Library,
  Search,
  Sparkles,
  Tag,
  Youtube,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { GuideData, GuideVideo } from './types'

type DetailTab = 'tips' | 'craft'

const dataUrl = `${import.meta.env.BASE_URL}data/content.json`

function formatDate(value: string) {
  if (!value) return '날짜 미상'
  const [year, month, day] = value.split('-')
  return `${year}.${month}.${day}`
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours ? `${hours}시간 ${minutes}분` : `${minutes}분`
}

function videoFromHash(data: GuideData | null) {
  if (!data) return null
  const match = window.location.hash.match(/^#\/video\/(.+)$/)
  return match ? data.videos.find((video) => video.id === decodeURIComponent(match[1])) ?? null : null
}

function SourcePill({ children }: { children: React.ReactNode }) {
  return <span className="source-pill">{children}</span>
}

function App() {
  const [data, setData] = useState<GuideData | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState('전체')
  const [selected, setSelected] = useState<GuideVideo | null>(null)
  const [tab, setTab] = useState<DetailTab>('tips')

  useEffect(() => {
    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`콘텐츠를 불러오지 못했습니다 (${response.status})`)
        return response.json() as Promise<GuideData>
      })
      .then((payload) => {
        setData(payload)
        setSelected(videoFromHash(payload))
      })
      .catch((reason: Error) => setError(reason.message))
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      setSelected(videoFromHash(data))
      setTab('tips')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [data])

  const channels = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.videos.map((video) => video.channel))).sort((a, b) => a.localeCompare(b, 'ko'))
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLocaleLowerCase('ko')
    return data.videos.filter((video) => {
      if (channel !== '전체' && video.channel !== channel) return false
      if (!needle) return true
      return [video.title, video.channel, video.summary, video.tips, video.craft, video.patch, video.series]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('ko')
        .includes(needle)
    })
  }, [data, query, channel])

  const openVideo = (video: GuideVideo) => {
    window.location.hash = `/video/${encodeURIComponent(video.id)}`
  }

  const closeVideo = () => {
    window.location.hash = '/'
  }

  if (error) {
    return (
      <main className="status-screen">
        <div className="status-mark">!</div>
        <h1>가이드를 열 수 없습니다</h1>
        <p>{error}</p>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="status-screen">
        <div className="loader" />
        <p>가이드 인덱스를 불러오는 중</p>
      </main>
    )
  }

  if (selected) {
    return (
      <div className="app-shell detail-shell">
        <header className="topbar detail-topbar">
          <a className="brand" href="#/" aria-label="POE2 Guide 홈">
            <span className="brand-rune">Ⅱ</span>
            <span>POE2 <strong>GUIDE</strong></span>
          </a>
          <button className="back-button" onClick={closeVideo}>
            <ArrowLeft size={17} /> 전체 가이드
          </button>
        </header>

        <main className="detail-page">
          <div className="detail-kicker">
            <span>{selected.channel}</span>
            {selected.patch && <SourcePill>PATCH {selected.patch}</SourcePill>}
            {selected.series && <SourcePill>{selected.series}</SourcePill>}
          </div>
          <h1>{selected.title}</h1>
          <p className="detail-summary">{selected.summary}</p>

          <div className="detail-meta">
            <span><CalendarDays size={16} /> {formatDate(selected.uploadDate)}</span>
            {formatDuration(selected.durationSeconds) && (
              <span><Clock3 size={16} /> {formatDuration(selected.durationSeconds)}</span>
            )}
          </div>

          <div className="detail-actions">
            <a className="primary-action" href={selected.url} target="_blank" rel="noreferrer">
              <Youtube size={18} /> 원본 영상 <ExternalLink size={15} />
            </a>
            {selected.pobUrl && (
              <a className="secondary-action" href={selected.pobUrl} target="_blank" rel="noreferrer">
                PoB 열기 <ArrowUpRight size={16} />
              </a>
            )}
          </div>

          <div className="content-tabs" role="tablist" aria-label="가이드 콘텐츠">
            <button className={tab === 'tips' ? 'active' : ''} onClick={() => setTab('tips')}>
              <BookOpen size={17} /> 핵심 가이드
            </button>
            <button className={tab === 'craft' ? 'active' : ''} onClick={() => setTab('craft')}>
              <Sparkles size={17} /> 제작·구매
            </button>
          </div>

          <article className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
              }}
            >
              {tab === 'tips' ? selected.tips : selected.craft || '이 영상에는 별도의 제작 절차가 없습니다.'}
            </ReactMarkdown>
          </article>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#/" aria-label="POE2 Guide 홈">
          <span className="brand-rune">Ⅱ</span>
          <span>POE2 <strong>GUIDE</strong></span>
        </a>
        <span className="archive-label">VIDEO INTELLIGENCE ARCHIVE</span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> EXILE INTELLIGENCE</div>
            <h1>긴 영상은 줄이고,<br /><em>필요한 판단만.</em></h1>
            <p>PoE2 영상의 장비 교체, 레벨링, 제작법과 보스 대응을 타임스탬프·PoB 근거와 함께 검색하세요.</p>
          </div>
          <div className="stat-grid" aria-label="아카이브 통계">
            <div className="stat-card featured">
              <Library size={20} />
              <strong>{data.videoCount}</strong>
              <span>분석된 영상</span>
            </div>
            <div className="stat-card">
              <Youtube size={20} />
              <strong>{data.channelCount}</strong>
              <span>전문 채널</span>
            </div>
            <div className="stat-card wide">
              <CalendarDays size={20} />
              <strong>{formatDate(data.videos[0]?.uploadDate ?? '')}</strong>
              <span>최근 업데이트</span>
            </div>
          </div>
        </section>

        <section className="archive-section">
          <div className="section-heading">
            <div>
              <span className="section-index">01</span>
              <h2>가이드 아카이브</h2>
            </div>
            <span className="result-count">{filtered.length} RESULTS</span>
          </div>

          <div className="filter-panel">
            <label className="search-field">
              <Search size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="스킬, 장비, 보스, 제작법 검색"
                aria-label="가이드 검색"
              />
              {query && <button onClick={() => setQuery('')} aria-label="검색어 지우기">ESC</button>}
            </label>
            <label className="channel-filter">
              <Filter size={17} />
              <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="채널 필터">
                <option value="전체">전체 채널</option>
                {channels.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>

          {filtered.length ? (
            <div className="guide-grid">
              {filtered.map((video, index) => (
                <button className="guide-card" key={video.id} onClick={() => openVideo(video)}>
                  <div className="card-topline">
                    <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="channel-name">{video.channel}</span>
                    <ChevronRight className="card-arrow" size={19} />
                  </div>
                  <h3>{video.title}</h3>
                  <p>{video.summary}</p>
                  <div className="card-footer">
                    <span><CalendarDays size={14} /> {formatDate(video.uploadDate)}</span>
                    {video.patch && <span><Tag size={14} /> {video.patch}</span>}
                    {formatDuration(video.durationSeconds) && <span><Clock3 size={14} /> {formatDuration(video.durationSeconds)}</span>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <h3>일치하는 가이드가 없습니다</h3>
              <p>검색어를 줄이거나 다른 채널을 선택해 보세요.</p>
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>POE2 GUIDE ARCHIVE</span>
        <p>원본 영상과 공개 PoB를 바탕으로 정리된 커뮤니티 가이드입니다.</p>
      </footer>
    </div>
  )
}

export default App
