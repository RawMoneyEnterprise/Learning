import { useState, useEffect, useRef } from 'react'
import {
  Bell, User, ChevronDown, ArrowUp, Calendar,
  Sparkles, FileText, BarChart2
} from 'lucide-react'
import './index.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const CLIENT = { name: 'Sarah', business: 'Coastal Bloom Florist', initials: 'CB' }

const TEAM_ACTIVITY = [
  { role: 'Strategist', task: 'Finalising your May content calendar' },
  { role: 'Writer', task: 'Drafting 4 Instagram captions' },
  { role: 'Designer', task: 'Preparing your visual mood board' },
]

const QUICK_ACTIONS = [
  { Icon: Sparkles, label: 'New campaign' },
  { Icon: FileText, label: 'Create content' },
  { Icon: BarChart2, label: 'View results' },
]

const STATS = [
  { value: '24,800', label: 'People reached' },
  { value: '6.2%', label: 'Engagement rate' },
  { value: '143', label: 'Actions taken' },
]

const STARTER_MESSAGES = [
  {
    from: 'am',
    text: "Morning! The team's been busy — your Mother's Day campaign is underway and 2 pieces are ready for your approval. Want to take a look?",
    time: 'Today, 9:14am',
  },
]

const SUGGESTED_PROMPTS = [
  'Schedule a new campaign',
  "Check what\u2019s in progress",
  'Review something for me',
]

// ─── Nav ─────────────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--canvas)',
      borderBottom: '1px solid var(--border-dark)',
      height: 64,
      display: 'flex', alignItems: 'center',
      padding: '0 var(--pad)',
    }}>
      {/* Wordmark */}
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>
        bureau
      </span>

      {/* Right cluster */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--muted-dark)' }}>
          {CLIENT.business}
        </span>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--border-dark)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 500,
          color: 'var(--text-dark)', letterSpacing: '0.05em',
        }}>
          {CLIENT.initials}
        </div>

        {/* Bell with amber dot */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} strokeWidth={1.5} color="var(--muted-dark)" />
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--amber)',
            border: '1.5px solid var(--canvas)',
          }} />
        </div>
      </div>
    </nav>
  )
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onSelect }) {
  const tabs = ['Overview', 'Campaigns', 'Content', 'Results']
  return (
    <div style={{
      display: 'flex', gap: 24,
      padding: '0 var(--pad)',
      borderBottom: '1px solid var(--border-dark)',
      background: 'var(--canvas)',
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            color: active === tab ? 'var(--text-dark)' : 'var(--muted-dark)',
            borderBottom: active === tab ? '2px solid var(--lime)' : '2px solid transparent',
            padding: '12px 0',
            transition: 'color 200ms ease',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── Card A — Greeting ───────────────────────────────────────────────────────

function CardGreeting({ delay }) {
  return (
    <div className="card-dark card-animate" style={{ animationDelay: `${delay}ms`, gridColumn: 'span 2' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
        Good morning, {CLIENT.name}.
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--muted-dark)' }}>
        Here's what your team is working on today.
      </p>
    </div>
  )
}

// ─── Card B — Active Campaigns ───────────────────────────────────────────────

function CardActiveCampaigns({ delay }) {
  return (
    <div className="card-dark card-animate" style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono">Active campaigns</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'white', marginTop: 12, lineHeight: 1, flex: 1 }}>
        3
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16 }}>
        <span className="pulse-dot" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-dark)' }}>In progress</span>
      </div>
    </div>
  )
}

// ─── Card C — Pending Approvals ──────────────────────────────────────────────

function CardPendingApprovals({ delay }) {
  return (
    <div className="card-light card-animate" style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono-light">Needs your review</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: 'var(--text-light)', marginTop: 12, lineHeight: 1, flex: 1 }}>
        2
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16 }}>
        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-light)' }}>Awaiting your approval</span>
      </div>
    </div>
  )
}

// ─── Card D — Current Campaign ───────────────────────────────────────────────

function CardCurrentCampaign({ delay }) {
  return (
    <div className="card-light card-animate" style={{ animationDelay: `${delay}ms`, gridColumn: 'span 2', gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono-light">Current campaign</p>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 12 }}>
        Mother's Day — May 2026
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        {/* Campaign type badge */}
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'white',
          background: 'var(--violet)', borderRadius: 999, padding: '4px 12px',
        }}>
          Social + Email
        </span>
        {/* Status */}
        <span className="pulse-dot" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--lime)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-light)' }}>In progress</span>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--muted-light)', marginTop: 16, lineHeight: 1.5 }}>
        Seasonal campaign targeting existing customers and local reach. Content calendar, 6 posts, and 2 email blasts.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '20px 0' }} />

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-light)' }}>Progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-light)' }}>40%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: '40%' }} />
        </div>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 20 }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          color: 'var(--lime)', display: 'flex', alignItems: 'center', gap: 4,
        }}>
          View campaign →
        </button>
      </div>
    </div>
  )
}

// ─── Card E — Your Team ──────────────────────────────────────────────────────

function CardYourTeam({ delay }) {
  return (
    <div className="card-dark card-animate" style={{ animationDelay: `${delay}ms`, gridRow: 'span 2', display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono">Your team</p>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
        {TEAM_ACTIVITY.map(({ role, task }) => (
          <div key={role}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: 4 }}>
              {role}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-dark)', marginBottom: 8 }}>
              {task}
            </p>
            <div className="shimmer-bar" />
          </div>
        ))}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-dark)', margin: '20px 0' }} />

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--lime)' }}>
        Your team is on it.
      </p>
    </div>
  )
}

// ─── Card F — Quick Actions ───────────────────────────────────────────────────

function CardQuickActions({ delay }) {
  return (
    <div className="card-light card-animate" style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono-light" style={{ marginBottom: 12 }}>Get started</p>

      <div style={{ flex: 1 }}>
        {QUICK_ACTIONS.map(({ Icon, label }) => (
          <div key={label} className="action-row">
            <Icon size={20} strokeWidth={1.5} color="var(--muted-light)" />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--text-light)', flex: 1 }}>
              {label}
            </span>
            <span style={{ color: 'var(--muted-light)', fontSize: '1rem' }}>→</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card G — Performance Snapshot ───────────────────────────────────────────

function CardPerformance({ delay }) {
  return (
    <div className="card-light card-animate" style={{ animationDelay: `${delay}ms`, gridColumn: 'span 2' }}>
      <p className="label-mono-light" style={{ marginBottom: 20 }}>This month</p>

      <div style={{ display: 'flex' }}>
        {STATS.map(({ value, label }, i) => (
          <div key={label} className="stat-col" style={{
            flex: 1, textAlign: 'center', paddingInline: 16,
            borderLeft: i > 0 ? '1px solid var(--border-light)' : 'none',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-light)', lineHeight: 1 }}>
              {value}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--muted-light)', marginTop: 6 }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card H — Ready for Review ────────────────────────────────────────────────

function CardReadyForReview({ delay }) {
  return (
    <div className="card-light card-animate" style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}>
      <p className="label-mono-light">Ready for review</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-light)', marginTop: 12 }}>
        Easter Weekend — Email Campaign
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--muted-light)', marginTop: 8, lineHeight: 1.45 }}>
        Completed by your team. Awaiting your sign-off.
      </p>
      <div style={{ marginTop: 'auto', paddingTop: 16 }}>
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          color: 'var(--amber)',
        }}>
          Review now →
        </button>
      </div>
    </div>
  )
}

// ─── Card I — Next Up ─────────────────────────────────────────────────────────

function CardNextUp({ delay }) {
  return (
    <div className="card-dark card-animate" style={{ animationDelay: `${delay}ms`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p className="label-mono">Next up</p>
        <Calendar size={20} strokeWidth={1.5} color="var(--muted-dark)" />
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'white', marginTop: 16 }}>
        Instagram posts
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--violet)', marginTop: 6 }}>
        Thursday, 11 Apr
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--muted-dark)', marginTop: 8 }}>
        Scheduled for publishing
      </p>
    </div>
  )
}

// ─── Bento Grid ───────────────────────────────────────────────────────────────

function BentoGrid() {
  return (
    <div
      className="bento-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--gap)',
        padding: 'var(--pad)',
      }}
    >
      {/* Row 1 */}
      <CardGreeting delay={0} />
      <CardActiveCampaigns delay={60} />
      <CardPendingApprovals delay={120} />

      {/* Row 2 */}
      <CardCurrentCampaign delay={180} />
      <CardYourTeam delay={240} />
      <CardQuickActions delay={300} />

      {/* Row 3 */}
      <CardPerformance delay={360} />
      <CardReadyForReview delay={420} />
      <CardNextUp delay={480} />
    </div>
  )
}

// ─── AM Widget ────────────────────────────────────────────────────────────────

function AMWidget() {
  const [open, setOpen] = useState(false)
  const [showLabel, setShowLabel] = useState(true)
  const [messages, setMessages] = useState(STARTER_MESSAGES)
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    // Auto-hide label after 4s
    const t = setTimeout(() => setShowLabel(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [open, messages])

  function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setMessages(m => [...m, { from: 'client', text: msg, time: null }])
    setInput('')
    setShowSuggestions(false)

    // AM replies after short delay
    setTimeout(() => {
      setMessages(m => [...m, {
        from: 'am',
        text: "Leave it with me — I'll loop in the team on that and come back to you shortly.",
        time: null,
      }])
    }, 1200)
  }

  function handleKey(e) {
    if (e.key === 'Enter') send()
  }

  return (
    <>
      {/* Label */}
      {(showLabel || isHovered) && !open && (
        <div
          className={`am-label${showLabel && !isHovered ? ' am-label-auto' : ''}`}
        >
          Your Account Manager
        </div>
      )}

      {/* Panel */}
      {open && (
        <div className="am-panel panel-animate">
          {/* Header */}
          <div style={{
            background: 'var(--card-dark)',
            borderBottom: '1px solid #2A2A2A',
            padding: '16px 20px',
            height: 72,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--border-dark)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 500,
              color: 'var(--lime)', letterSpacing: '0.05em', flexShrink: 0,
            }}>
              AM
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9375rem', color: 'white', lineHeight: 1.2 }}>
                Alex
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--muted-dark)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Account Manager
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--muted-dark)' }}>Online now</span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-dark)', display: 'flex' }}
            >
              <ChevronDown size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Conversation */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--card-light)',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msg.time && (
                  <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--muted-light)' }}>
                    {msg.time}
                  </p>
                )}
                <div className={msg.from === 'am' ? 'bubble-am' : 'bubble-client'}>
                  {msg.text}
                </div>

                {/* Suggested prompts after first AM message */}
                {msg.from === 'am' && i === 0 && showSuggestions && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {SUGGESTED_PROMPTS.map(p => (
                      <button key={p} className="prompt-pill" onClick={() => send(p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{
            background: 'white',
            borderTop: '1px solid var(--border-light)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message your account manager..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                color: 'var(--text-light)', background: 'transparent',
              }}
            />
            <button
              onClick={() => send()}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--lime)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ArrowUp size={18} strokeWidth={2} color="#111111" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className={`am-button${!open && !isHovered ? ' breathe' : ''}`}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={isHovered ? { transform: 'scale(1.08)', animationPlayState: 'paused' } : {}}
        aria-label="Open account manager chat"
      >
        <User size={26} strokeWidth={2} color="#111111" />
      </button>
    </>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <NavBar />
      <TabBar active={activeTab} onSelect={setActiveTab} />
      <BentoGrid />
      <AMWidget />
    </div>
  )
}
