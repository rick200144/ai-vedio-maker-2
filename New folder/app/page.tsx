'use client';

import { useEffect, useMemo, useState } from 'react';

type TaskStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';

type HistoryItem = {
  id: string;
  prompt: string;
  ratio: string;
  duration: number;
  status: TaskStatus;
  output: string | null;
  createdAt: string;
};

const STORAGE_KEY = 'promptflow-runway-history-v1';

function statusClass(status: TaskStatus) {
  if (status === 'SUCCEEDED') return 'badge ok';
  if (status === 'FAILED' || status === 'CANCELED') return 'badge fail';
  return 'badge warn';
}

export default function HomePage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('A cinematic drone shot over a glowing futuristic city at night, neon reflections, misty atmosphere, slow camera movement.');
  const [ratio, setRatio] = useState('1280:720');
  const [duration, setDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>('IDLE');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore storage read errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore storage write errors
    }
  }, [history]);

  useEffect(() => {
    if (!taskId || status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED') {
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Task status route was not found. On Vercel, verify the project Root Directory points to this Next.js app, then redeploy.');
          }
          throw new Error(data.error || 'Polling failed.');
        }

        setStatus(data.status);

        setHistory((current) =>
          current.map((item) =>
            item.id === taskId
              ? { ...item, status: data.status, output: data.output ?? null }
              : item
          )
        );

        if (data.status === 'SUCCEEDED' && data.output) {
          setVideoUrl(data.output);
        }

        if (data.status === 'FAILED') {
          setError(data.failureCode || data.failureMessage || 'Generation failed.');
        }
      } catch (pollError) {
        const message = pollError instanceof Error ? pollError.message : 'Could not check task status.';
        setError(message);
      }
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [taskId, status]);

  async function onGenerate() {
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setStatus('PENDING');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ratio, duration })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Generate route was not found. On Vercel, verify the project Root Directory points to this Next.js app, then redeploy.');
        }
        throw new Error(data.error || 'Generation could not be started.');
      }

      setTaskId(data.taskId);
      setStatus('PENDING');

      const item: HistoryItem = {
        id: data.taskId,
        prompt,
        ratio,
        duration,
        status: 'PENDING',
        output: null,
        createdAt: new Date().toLocaleString()
      };

      setHistory((current) => [item, ...current]);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to submit prompt.';
      setError(message);
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  }

  const currentBadge = useMemo(() => statusClass(status), [status]);

  return (
    <main className="page">
      <header className="header">
        <div className="shell headerRow">
          <div className="brand">
            <div className="brandBadge">▶</div>
            <div className="brandMeta">
              <span>PromptFlow Video</span>
              <small>Real Runway-powered prompt-to-video app</small>
            </div>
          </div>
          <div className="pill">
            API status:{' '}
            <strong className={configured ? 'statusOk' : ''}>
              {configured === null ? 'Checking…' : configured ? 'Ready' : 'Missing key'}
            </strong>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="shell heroGrid">
          <div className="panel">
            <div className="pill">Full-stack app • Next.js + Runway API</div>
            <h1 className="heroTitle">Type a prompt. Generate a real video.</h1>
            <p className="heroText">
              This build is wired for real server-side video generation. Once you add your
              <span className="code"> RUNWAYML_API_SECRET </span>
              and deploy it on a server platform like Vercel, the prompt form starts real jobs instead of a fake demo.
            </p>
            <div className="grid2" style={{ marginTop: 20 }}>
              <div className="stat">
                <span className="soft">Provider</span>
                <strong>Runway Gen-4.5</strong>
              </div>
              <div className="stat">
                <span className="soft">Flow</span>
                <strong>Submit → Poll → Preview</strong>
              </div>
              <div className="stat">
                <span className="soft">Durations</span>
                <strong>5s or 10s</strong>
              </div>
              <div className="stat">
                <span className="soft">Output</span>
                <strong>Hosted MP4 URL</strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="formGrid">
              <label className="label">
                Prompt
                <textarea
                  className="textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the scene, subject, camera movement, lighting, and mood."
                />
              </label>

              <div className="twoCol">
                <label className="label">
                  Aspect ratio
                  <select className="select" value={ratio} onChange={(e) => setRatio(e.target.value)}>
                    <option value="1280:720">Landscape — 1280:720</option>
                    <option value="720:1280">Portrait — 720:1280</option>
                    <option value="1104:832">Wide — 1104:832</option>
                    <option value="832:1104">Tall — 832:1104</option>
                  </select>
                </label>

                <label className="label">
                  Duration
                  <select className="select" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                  </select>
                </label>
              </div>

              <div className="toggleRow">
                <div className="toggle">
                  <div>
                    <strong>Server-side API</strong>
                    <br />
                    <small>Key stays off the client</small>
                  </div>
                  <div className={`switch ${configured ? 'on' : ''}`} />
                </div>
                <div className="toggle">
                  <div>
                    <strong>Result preview</strong>
                    <br />
                    <small>Shows output video URL when ready</small>
                  </div>
                  <div className={`switch ${videoUrl ? 'on' : ''}`} />
                </div>
              </div>

              <div className="actions">
                <button className="button" disabled={loading || !prompt.trim()} onClick={onGenerate}>
                  {loading ? 'Starting…' : 'Generate real video'}
                </button>
                <button
                  className="button buttonGhost"
                  onClick={() => {
                    setPrompt('A luxury perfume bottle on black glass, soft golden light, cinematic close-up, elegant slow motion, premium ad style.');
                    setRatio('1280:720');
                    setDuration(5);
                  }}
                >
                  Load sample prompt
                </button>
              </div>

              {status !== 'IDLE' && (
                <div className="info message">
                  Current task status: <strong className={currentBadge}>{status}</strong>
                  {taskId ? <> <br />Task ID: <span className="code">{taskId}</span></> : null}
                </div>
              )}

              {error && <div className="error message">{error}</div>}
              {configured === false && (
                <div className="error message">
                  Add <span className="code">RUNWAYML_API_SECRET</span> to your environment first. The frontend is real, but the server cannot start jobs until the API key is configured.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell twoCol">
          <div className="panel">
            <h2 style={{ marginTop: 0 }}>Latest result</h2>
            <p className="muted">When a Runway task finishes, the video URL appears here automatically.</p>
            {videoUrl ? (
              <>
                <video className="resultVideo" src={videoUrl} controls playsInline />
                <div className="actions" style={{ marginTop: 16 }}>
                  <a className="button" href={videoUrl} target="_blank" rel="noreferrer">Open video URL</a>
                </div>
              </>
            ) : (
              <div className="historyCard">
                <strong>No finished video yet.</strong>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Submit a prompt and keep the page open while the app polls the task status every 5 seconds.
                </p>
              </div>
            )}
          </div>

          <div className="panel">
            <h2 style={{ marginTop: 0 }}>How this app works</h2>
            <div className="historyList">
              <div className="historyCard">
                <strong>1. POST /api/generate</strong>
                <p className="muted">Starts a real Runway generation task from your prompt.</p>
              </div>
              <div className="historyCard">
                <strong>2. GET /api/tasks/[id]</strong>
                <p className="muted">Polls the task until it reaches SUCCEEDED, FAILED, or CANCELED.</p>
              </div>
              <div className="historyCard">
                <strong>3. Preview the output</strong>
                <p className="muted">When the task succeeds, the first output URL is shown inside the built-in video player.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell panel">
          <h2 style={{ marginTop: 0 }}>Generation history</h2>
          <p className="muted">Saved in your browser so you can keep track of prompts and output links.</p>
          <div className="historyList">
            {history.length === 0 ? (
              <div className="historyCard">
                <strong>No generations yet.</strong>
                <p className="muted" style={{ marginBottom: 0 }}>Your new tasks will show up here.</p>
              </div>
            ) : history.map((item) => (
              <div key={item.id} className="historyCard">
                <div className="historyCardHeader">
                  <div>
                    <strong>{item.prompt}</strong>
                    <p className="soft">{item.createdAt}</p>
                  </div>
                  <span className={statusClass(item.status)}>{item.status}</span>
                </div>
                <p className="muted">Ratio: {item.ratio} • Duration: {item.duration}s</p>
                {item.output ? (
                  <a className="button buttonGhost" href={item.output} target="_blank" rel="noreferrer">Open output</a>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="shell">
          Built for real deployment. Add <span className="code">RUNWAYML_API_SECRET</span>, install packages, and deploy to Vercel or another Node-compatible platform.
        </div>
      </footer>
    </main>
  );
}
