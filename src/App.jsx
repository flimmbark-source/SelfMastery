import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'self-mastery-prototype-v3';
const INSTALL_PROMPT_DISMISSED_KEY = 'self-mastery-install-dismissed';

const TRIAL_TYPES = ['Urge', 'Avoidance', 'Fog', 'Fatigue', 'Pain', 'Emotion'];
const MASTERY_TYPES = [
  'Returned After Avoidance',
  'Completed Under Resistance',
  'Replaced Bad Impulse',
  'Endured Discomfort',
  'Protected Energy',
  'Advanced Something Important'
];
const MASTERY_CONTEXTS = ['Routine', 'Work', 'Health', 'Emotion', 'Environment', 'Relationship'];
const REINFORCEMENTS = ['Discipline', 'Self-trust', 'Stability', 'Restraint', 'Courage', 'Consistency'];
const REGULATE_NEEDS = ['Calm', 'Clarity', 'Grounding', 'Movement', 'Rest', 'Focus'];
const CHECKIN_FIELDS = {
  Energy: ['Low', 'Medium', 'High'],
  Clarity: ['Foggy', 'Mixed', 'Clear'],
  Risk: ['Low', 'Medium', 'High']
};
const EMOTIONS = ['Angry', 'Anxious', 'Ashamed', 'Overwhelmed', 'Restless', 'Sad'];

const TRIAL_ACTIONS = {
  Urge: {
    primary: { label: 'Physically leave the trigger space now.', mode: 'timer', duration: 120 },
    alternate: { label: 'Start a 60-second hold and keep your hands occupied.', mode: 'timer', duration: 60 }
  },
  Avoidance: {
    primary: { label: 'Do one visible step right now.', mode: 'timer', duration: 90 },
    alternate: { label: 'Reduce the task to a 2-minute start.', mode: 'timer', duration: 120 }
  },
  Fog: {
    primary: { label: 'Write one true sentence.', mode: 'text', prompt: 'Write one true sentence about what is going on right now.' },
    alternate: { label: 'Choose one task only and hide the rest.', mode: 'timer', duration: 90 }
  },
  Fatigue: {
    primary: { label: 'Lower demand and choose one essential action.', mode: 'timer', duration: 90 },
    alternate: { label: 'Stand up, drink water, and reset posture.', mode: 'timer', duration: 60 }
  },
  Pain: {
    primary: { label: 'Change position and reduce effort now.', mode: 'timer', duration: 90 },
    alternate: { label: 'Shift into recovery mode for 5 minutes.', mode: 'timer', duration: 120 }
  },
  Emotion: {
    primary: { label: 'Name the emotion before acting.', mode: 'select', prompt: 'What emotion is hottest right now?', options: EMOTIONS },
    alternate: { label: 'Leave the situation and pause for 2 minutes.', mode: 'timer', duration: 120 }
  }
};

const REGULATE_ACTIONS = {
  Calm: {
    primary: { label: 'Breathe slowly for 60 seconds.', mode: 'timer', duration: 60 },
    alternate: { label: 'Reduce stimulation right now.', mode: 'timer', duration: 60 }
  },
  Clarity: {
    primary: { label: 'Write one true sentence.', mode: 'text', prompt: 'Write one true sentence that cuts through the noise.' },
    alternate: { label: 'Name the next task only.', mode: 'text', prompt: 'Type the next task in a few words.' }
  },
  Grounding: {
    primary: { label: 'Stand still and feel your feet for 30 seconds.', mode: 'timer', duration: 30 },
    alternate: { label: 'Touch something cold or textured.', mode: 'timer', duration: 30 }
  },
  Movement: {
    primary: { label: 'Stretch for 1 minute.', mode: 'timer', duration: 60 },
    alternate: { label: 'Take a short walk.', mode: 'timer', duration: 90 }
  },
  Rest: {
    primary: { label: 'Soften demands for 5 minutes.', mode: 'timer', duration: 120 },
    alternate: { label: 'Lie down without scrolling.', mode: 'timer', duration: 90 }
  },
  Focus: {
    primary: { label: 'Choose one task and hide everything else.', mode: 'text', prompt: 'What is the one task?' },
    alternate: { label: 'Start for 2 minutes only.', mode: 'timer', duration: 120 }
  }
};

const REGULATE_SCAN = {
  Body: ['Tense', 'Heavy', 'Okay'],
  Mind: ['Foggy', 'Restless', 'Clear'],
  Emotion: ['Low', 'Uneasy', 'Steady'],
  Energy: ['Low', 'Medium', 'High']
};

const INITIAL_DATA = {
  entries: [],
  lastAction: null,
  morningCheckIn: null,
  tutorialSeen: false,
  notes: []
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_DATA;
  } catch {
    return INITIAL_DATA;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function Button({ children, onClick, variant = 'default', className = '', disabled = false }) {
  const styles = {
    default: 'bg-zinc-900 border border-zinc-800 text-zinc-100 hover:border-zinc-700',
    accent: 'bg-zinc-100 text-black border border-zinc-200 hover:bg-white',
    subtle: 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:border-zinc-800',
    danger: 'bg-red-950/30 border border-red-900/40 text-red-300 hover:border-red-800'
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-4 text-left text-base transition active:scale-[0.99] disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Header({ title, subtitle, onBack }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="mt-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-400"
        >
          Back
        </button>
      )}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function Card({ title, children, tone = 'default' }) {
  const tones = {
    default: 'border-zinc-800 bg-zinc-950',
    trial: 'border-red-900/40 bg-red-950/10',
    mastery: 'border-blue-900/40 bg-blue-950/10',
    regulate: 'border-emerald-900/40 bg-emerald-950/10'
  };
  return (
    <div className={`rounded-3xl border p-4 ${tones[tone]}`}>
      {title ? <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">{title}</div> : null}
      {children}
    </div>
  );
}

function Pill({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-3 py-3 text-sm ${selected ? 'border-zinc-300 bg-zinc-100 text-black' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
    >
      {children}
    </button>
  );
}

function TextCapture({ title, prompt, value, onChange, onContinue, onBack, buttonLabel = 'Save sentence' }) {
  return (
    <div>
      <Header title={title} subtitle={prompt} onBack={onBack} />
      <Card>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type here..."
          className="min-h-[180px] w-full resize-none rounded-2xl border border-zinc-800 bg-black p-4 text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </Card>
      <div className="mt-4">
        <Button variant="accent" disabled={!value.trim()} onClick={onContinue}>{buttonLabel}</Button>
      </div>
    </div>
  );
}

function getRelativeTime(ts) {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function summarizeInsight(entries, morningCheckIn) {
  if (morningCheckIn && !entries.length) {
    return `Today starts at ${morningCheckIn.Energy?.toLowerCase() || 'unknown'} energy and ${morningCheckIn.Risk?.toLowerCase() || 'unknown'} risk.`;
  }

  if (!entries.length) return 'Start using the app and your patterns will appear here.';

  const recent = entries.slice(-12);
  const trials = recent.filter((e) => e.kind === 'trial');
  const mastery = recent.filter((e) => e.kind === 'mastery');
  const regulates = recent.filter((e) => e.kind === 'regulate');

  if (trials.length) {
    const counts = trials.reduce((acc, e) => {
      acc[e.trialType] = (acc[e.trialType] || 0) + 1;
      return acc;
    }, {});
    const [topType] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return `${topType} has been your main pressure point lately.`;
  }

  if (regulates.length) {
    const better = regulates.filter((r) => r.result === 'Better').length;
    return `${better} regulation actions improved your state recently.`;
  }

  if (mastery.length) {
    return `You have recorded ${mastery.length} meaningful mastery actions recently.`;
  }

  return 'Use Trial, Mastery, or Regulate to build your first pattern set.';
}

function deriveProgress(entries) {
  const trialEntries = entries.filter((e) => e.kind === 'trial');
  const masteryEntries = entries.filter((e) => e.kind === 'mastery');
  const regulateEntries = entries.filter((e) => e.kind === 'regulate');

  const topTrial = Object.entries(
    trialEntries.reduce((acc, e) => {
      acc[e.trialType] = (acc[e.trialType] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const bestAction = Object.entries(
    trialEntries.reduce((acc, e) => {
      const key = e.selectedActionLabel || 'Hold';
      if (e.outcome === 'Held') acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const byHour = entries.reduce((acc, e) => {
    const hr = new Date(e.timestamp).getHours();
    acc[hr] = (acc[hr] || 0) + 1;
    return acc;
  }, {});
  const peakHour = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  const growthThemes = ['Discipline', 'Stability', 'Self-trust', 'Regulation', 'Restraint', 'Follow-through'].map((theme) => {
    let value = 10;
    if (theme === 'Regulation') value += regulateEntries.filter((e) => e.result === 'Better').length * 10;
    if (theme === 'Discipline') value += masteryEntries.filter((e) => e.reinforcement === 'Discipline').length * 12;
    if (theme === 'Self-trust') value += masteryEntries.filter((e) => e.reinforcement === 'Self-trust').length * 12;
    if (theme === 'Restraint') value += trialEntries.filter((e) => e.outcome === 'Held').length * 10;
    if (theme === 'Stability') value += masteryEntries.filter((e) => e.reinforcement === 'Stability').length * 12;
    if (theme === 'Follow-through') value += masteryEntries.filter((e) => ['Returned After Avoidance', 'Completed Under Resistance', 'Advanced Something Important'].includes(e.masteryType)).length * 8;
    return { theme, value: Math.min(value, 100) };
  });

  return {
    weeklyInsights: [
      trialEntries.length
        ? `${topTrial?.[0] || 'Trial'} has been your most common pressure state.`
        : 'No trial patterns yet. Use Trial when pressure is active.',
      masteryEntries.length
        ? `You recorded ${masteryEntries.length} mastery actions that clearly built you.`
        : 'No mastery actions recorded yet.',
      regulateEntries.length
        ? `${regulateEntries.filter((e) => e.result === 'Better').length} regulation attempts improved your state.`
        : 'No regulation data yet.'
    ],
    patterns: {
      commonTrial: topTrial?.[0] || 'None yet',
      effectiveAction: bestAction?.[0] || 'None yet',
      busiestHour: peakHour ? `${peakHour[0]}:00` : 'Unknown',
      highestRisk: topTrial?.[0] || 'Unknown'
    },
    growthThemes,
    proof: [
      `You held under pressure ${trialEntries.filter((e) => e.outcome === 'Held').length} times.`,
      `You completed strong mastery actions ${masteryEntries.length} times.`,
      `You regulated before escalation ${regulateEntries.filter((e) => e.result === 'Better').length} times.`
    ]
  };
}

export default function SelfMasteryPrototype() {
  const [data, setData] = useState(INITIAL_DATA);
  const [view, setView] = useState('home');
  const [flowStep, setFlowStep] = useState(0);
  const [trialType, setTrialType] = useState('');
  const [selectedActionKey, setSelectedActionKey] = useState('primary');
  const [holdSeconds, setHoldSeconds] = useState(60);
  const [masteryType, setMasteryType] = useState('');
  const [masteryContext, setMasteryContext] = useState('');
  const [reinforcement, setReinforcement] = useState('');
  const [regulateScan, setRegulateScan] = useState({});
  const [regulateNeed, setRegulateNeed] = useState('');
  const [checkIn, setCheckIn] = useState({});
  const [captureText, setCaptureText] = useState('');
  const [captureChoice, setCaptureChoice] = useState('');
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installBannerVisible, setInstallBannerVisible] = useState(false);

  useEffect(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const dismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true';
    if (isStandalone || dismissed) return;

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPromptEvent(event);
      setInstallBannerVisible(true);
    }

    function onAppInstalled() {
      setInstallBannerVisible(false);
      setInstallPromptEvent(null);
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if ((view === 'trial' || view === 'regulate') && flowStep === 3 && holdSeconds > 0) {
      const id = setTimeout(() => setHoldSeconds((s) => s - 1), 1000);
      return () => clearTimeout(id);
    }
    if ((view === 'trial' || view === 'regulate') && flowStep === 3 && holdSeconds === 0) {
      setFlowStep(4);
    }
  }, [view, flowStep, holdSeconds]);

  const progress = useMemo(() => deriveProgress(data.entries), [data.entries]);
  const insight = useMemo(() => summarizeInsight(data.entries, data.morningCheckIn), [data.entries, data.morningCheckIn]);

  function resetFlow(nextView = 'home') {
    setView(nextView);
    setFlowStep(0);
    setTrialType('');
    setSelectedActionKey('primary');
    setHoldSeconds(60);
    setMasteryType('');
    setMasteryContext('');
    setReinforcement('');
    setRegulateScan({});
    setRegulateNeed('');
    setCheckIn({});
    setCaptureText('');
    setCaptureChoice('');
  }

  function pushEntry(entry) {
    setData((prev) => ({
      ...prev,
      entries: [...prev.entries, entry],
      lastAction: entry,
      notes: entry.note ? [...prev.notes, { text: entry.note, from: entry.kind, timestamp: entry.timestamp }] : prev.notes
    }));
  }

  function currentTrialAction() {
    return trialType ? TRIAL_ACTIONS[trialType][selectedActionKey] : null;
  }

  function currentRegulateAction() {
    return regulateNeed ? REGULATE_ACTIONS[regulateNeed][selectedActionKey] : null;
  }

  function beginTrialAction(actionKey) {
    const action = TRIAL_ACTIONS[trialType][actionKey];
    setSelectedActionKey(actionKey);
    if (action.mode === 'timer') {
      setHoldSeconds(action.duration);
      setFlowStep(3);
      return;
    }
    setFlowStep(2);
  }

  function beginRegulateAction(actionKey) {
    const action = REGULATE_ACTIONS[regulateNeed][actionKey];
    setSelectedActionKey(actionKey);
    if (action.mode === 'timer') {
      setHoldSeconds(action.duration);
      setFlowStep(3);
      return;
    }
    setFlowStep(2);
  }

  function completeTrial(outcome) {
    const action = currentTrialAction();
    const note = action?.mode === 'text' ? captureText.trim() : action?.mode === 'select' ? captureChoice : '';
    pushEntry({
      id: crypto.randomUUID(),
      kind: 'trial',
      trialType,
      selectedActionKey,
      selectedActionLabel: action?.label || '',
      outcome,
      note,
      timestamp: Date.now()
    });
    resetFlow('home');
  }

  function completeMastery() {
    pushEntry({
      id: crypto.randomUUID(),
      kind: 'mastery',
      masteryType,
      context: masteryContext,
      reinforcement,
      timestamp: Date.now()
    });
    resetFlow('home');
  }

  function completeRegulate(result) {
    const action = currentRegulateAction();
    const note = action?.mode === 'text' ? captureText.trim() : '';
    pushEntry({
      id: crypto.randomUUID(),
      kind: 'regulate',
      scan: regulateScan,
      need: regulateNeed,
      action: action?.label || '',
      result,
      note,
      timestamp: Date.now()
    });
    if (result === 'Worse') {
      resetFlow('trial');
      return;
    }
    resetFlow('home');
  }

  function completeCheckIn() {
    setData((prev) => ({
      ...prev,
      morningCheckIn: { ...checkIn, timestamp: Date.now() }
    }));
    resetFlow('home');
  }

  function dismissTutorial() {
    setData((prev) => ({ ...prev, tutorialSeen: true }));
  }

  async function installApp() {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
      setInstallBannerVisible(false);
    }
    setInstallPromptEvent(null);
  }

  function dismissInstallPrompt() {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    setInstallBannerVisible(false);
  }

  function TrialView() {
    if (flowStep === 0) {
      return (
        <div>
          <Header title="Trial" subtitle="Something is actively pressing on you." onBack={() => resetFlow()} />
          <div className="grid grid-cols-2 gap-3">
            {TRIAL_TYPES.map((type) => (
              <Button key={type} onClick={() => { setTrialType(type); setFlowStep(1); }}>
                <div className="text-base font-medium">{type}</div>
              </Button>
            ))}
          </div>
        </div>
      );
    }

    const actionA = trialType ? TRIAL_ACTIONS[trialType].primary : null;
    const actionB = trialType ? TRIAL_ACTIONS[trialType].alternate : null;

    if (flowStep === 1) {
      return (
        <div>
          <Header title="Immediate Action" subtitle={trialType} onBack={() => setFlowStep(0)} />
          <div className="space-y-4">
            <Card title="Primary" tone="trial">
              <div className="text-2xl font-semibold leading-tight text-zinc-50">{actionA.label}</div>
              <button onClick={() => beginTrialAction('primary')} className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-black">Start this</button>
            </Card>
            <Card title="Alternate">
              <div className="text-lg leading-relaxed text-zinc-200">{actionB.label}</div>
              <button onClick={() => beginTrialAction('alternate')} className="mt-4 rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200">Use alternate</button>
            </Card>
          </div>
        </div>
      );
    }

    const action = currentTrialAction();

    if (flowStep === 2 && action?.mode === 'text') {
      return (
        <TextCapture
          title="Write"
          prompt={action.prompt}
          value={captureText}
          onChange={setCaptureText}
          onContinue={() => setFlowStep(4)}
          onBack={() => setFlowStep(1)}
        />
      );
    }

    if (flowStep === 2 && action?.mode === 'select') {
      return (
        <div>
          <Header title="Name It" subtitle={action.prompt} onBack={() => setFlowStep(1)} />
          <div className="grid grid-cols-2 gap-3">
            {action.options.map((option) => (
              <Button key={option} onClick={() => { setCaptureChoice(option); setFlowStep(4); }}>
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (flowStep === 3 && action?.mode === 'timer') {
      const minutes = Math.floor(holdSeconds / 60);
      const seconds = String(holdSeconds % 60).padStart(2, '0');
      return (
        <div className="flex min-h-[70vh] flex-col justify-center">
          <Header title="Hold" subtitle="Stay with the action, not the impulse." onBack={() => setFlowStep(1)} />
          <Card tone="trial">
            <div className="text-sm text-zinc-500">Current move</div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">{action.label}</div>
            <div className="mt-8 text-center font-mono text-6xl text-zinc-100">{minutes}:{seconds}</div>
            <div className="mt-4 text-center text-sm text-zinc-400">Do not decide anything else until this ends.</div>
          </Card>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="subtle" onClick={() => setHoldSeconds((s) => Math.max(10, s - 15))}>Shorten 15s</Button>
            <Button onClick={() => setFlowStep(4)}>I\'m still here</Button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Header title="Outcome" subtitle="How did that round go?" onBack={() => setFlowStep(action?.mode === 'timer' ? 3 : 1)} />
        {(captureText || captureChoice) ? (
          <Card title="Captured">
            <div className="text-zinc-200">{captureText || captureChoice}</div>
          </Card>
        ) : null}
        <div className="mt-4 space-y-3">
          <Button onClick={() => completeTrial('Held')}>Held</Button>
          <Button onClick={() => completeTrial('Partial')}>Partial</Button>
          <Button variant="danger" onClick={() => completeTrial('Collapsed')}>Collapsed</Button>
        </div>
      </div>
    );
  }

  function MasteryView() {
    if (flowStep === 0) {
      return (
        <div>
          <Header title="Mastery" subtitle="Record a meaningful action that built you." onBack={() => resetFlow()} />
          <div className="space-y-3">
            {MASTERY_TYPES.map((item) => (
              <Button key={item} onClick={() => { setMasteryType(item); setFlowStep(1); }}>
                {item}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    if (flowStep === 1) {
      return (
        <div>
          <Header title="Context" subtitle={masteryType} onBack={() => setFlowStep(0)} />
          <div className="grid grid-cols-2 gap-3">
            {MASTERY_CONTEXTS.map((item) => (
              <Button key={item} onClick={() => { setMasteryContext(item); setFlowStep(2); }}>
                {item}
              </Button>
            ))}
          </div>
        </div>
      );
    }
    if (flowStep === 2) {
      return (
        <div>
          <Header title="Reinforcement" subtitle="What did this strengthen?" onBack={() => setFlowStep(1)} />
          <div className="grid grid-cols-2 gap-3">
            {REINFORCEMENTS.map((item) => (
              <Button key={item} onClick={() => { setReinforcement(item); setFlowStep(3); }}>
                {item}
              </Button>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="subtle" onClick={() => { setReinforcement(''); setFlowStep(3); }}>Skip</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-[70vh] flex-col justify-center">
        <Card tone="mastery" title="Ready to Save">
          <div className="text-2xl font-semibold text-zinc-100">{masteryType}</div>
          <div className="mt-2 text-zinc-400">{masteryContext}{reinforcement ? ` • ${reinforcement}` : ''}</div>
        </Card>
        <div className="mt-4">
          <Button variant="accent" onClick={completeMastery}>Save mastery</Button>
        </div>
      </div>
    );
  }

  function RegulateView() {
    if (flowStep === 0) {
      return (
        <div>
          <Header title="Regulate" subtitle="You are off. Stabilize before it escalates." onBack={() => resetFlow()} />
          <div className="space-y-4">
            {Object.entries(REGULATE_SCAN).map(([label, options]) => (
              <Card key={label} title={label} tone="regulate">
                <div className="grid grid-cols-3 gap-2">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setRegulateScan((prev) => ({ ...prev, [label]: opt }))}
                      className={`rounded-2xl border px-3 py-3 text-sm ${regulateScan[label] === opt ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="accent" onClick={() => setFlowStep(1)}>Continue</Button>
          </div>
        </div>
      );
    }
    if (flowStep === 1) {
      return (
        <div>
          <Header title="Need" subtitle="What do you need most right now?" onBack={() => setFlowStep(0)} />
          <div className="grid grid-cols-2 gap-3">
            {REGULATE_NEEDS.map((need) => (
              <Button key={need} onClick={() => { setRegulateNeed(need); setFlowStep(2); }}>
                {need}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    const actionA = regulateNeed ? REGULATE_ACTIONS[regulateNeed].primary : null;
    const actionB = regulateNeed ? REGULATE_ACTIONS[regulateNeed].alternate : null;

    if (flowStep === 2) {
      return (
        <div>
          <Header title="Action" subtitle={regulateNeed} onBack={() => setFlowStep(1)} />
          <div className="space-y-4">
            <Card title="Primary" tone="regulate">
              <div className="text-2xl font-semibold text-zinc-100">{actionA.label}</div>
              <button onClick={() => beginRegulateAction('primary')} className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 font-medium text-black">Use this</button>
            </Card>
            <Card title="Alternate">
              <div className="text-lg text-zinc-200">{actionB.label}</div>
              <button onClick={() => beginRegulateAction('alternate')} className="mt-4 rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-200">Use alternate</button>
            </Card>
          </div>
        </div>
      );
    }

    const action = currentRegulateAction();

    if (flowStep === 3 && action?.mode === 'timer') {
      const minutes = Math.floor(holdSeconds / 60);
      const seconds = String(holdSeconds % 60).padStart(2, '0');
      return (
        <div className="flex min-h-[70vh] flex-col justify-center">
          <Header title="Regulate" subtitle="Stay with the reset for a moment." onBack={() => setFlowStep(2)} />
          <Card tone="regulate">
            <div className="text-sm text-zinc-500">Current move</div>
            <div className="mt-2 text-xl font-semibold text-zinc-100">{action.label}</div>
            <div className="mt-8 text-center font-mono text-6xl text-zinc-100">{minutes}:{seconds}</div>
          </Card>
          <div className="mt-4">
            <Button onClick={() => setFlowStep(4)}>I did the action</Button>
          </div>
        </div>
      );
    }

    if (flowStep === 3 && action?.mode === 'text') {
      return (
        <TextCapture
          title="Write"
          prompt={action.prompt}
          value={captureText}
          onChange={setCaptureText}
          onContinue={() => setFlowStep(4)}
          onBack={() => setFlowStep(2)}
          buttonLabel="Save and continue"
        />
      );
    }

    return (
      <div>
        <Header title="Re-check" subtitle="Did your state change?" onBack={() => setFlowStep(3)} />
        {(captureText || captureChoice) ? (
          <Card title="Captured">
            <div className="text-zinc-200">{captureText || captureChoice}</div>
          </Card>
        ) : null}
        <div className="mt-4 space-y-3">
          {['Better', 'Same', 'Worse'].map((result) => (
            <Button key={result} variant={result === 'Worse' ? 'danger' : 'default'} onClick={() => completeRegulate(result)}>
              {result}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  function CheckInView() {
    return (
      <div>
        <Header title="Morning Check-In" subtitle="Take stock before the day carries you." onBack={() => resetFlow()} />
        <div className="space-y-4">
          {Object.entries(CHECKIN_FIELDS).map(([label, options]) => (
            <Card key={label} title={label}>
              <div className="grid grid-cols-3 gap-2">
                {options.map((option) => (
                  <Pill key={option} selected={checkIn[label] === option} onClick={() => setCheckIn((prev) => ({ ...prev, [label]: option }))}>
                    {option}
                  </Pill>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="accent" onClick={completeCheckIn}>Save check-in</Button>
        </div>
      </div>
    );
  }

  function ProgressView() {
    return (
      <div>
        <Header title="Progress" subtitle="Evidence, not motivation theater." onBack={() => resetFlow()} />
        <div className="space-y-4">
          <Card title="This Week">
            <div className="space-y-3 text-zinc-200">
              {progress.weeklyInsights.map((line) => (
                <div key={line} className="border-l border-zinc-800 pl-3">{line}</div>
              ))}
            </div>
          </Card>
          <Card title="Patterns">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-zinc-500">Common trial</div><div className="mt-1 text-zinc-100">{progress.patterns.commonTrial}</div></div>
              <div><div className="text-zinc-500">Effective action</div><div className="mt-1 text-zinc-100">{progress.patterns.effectiveAction}</div></div>
              <div><div className="text-zinc-500">Most active hour</div><div className="mt-1 text-zinc-100">{progress.patterns.busiestHour}</div></div>
              <div><div className="text-zinc-500">Highest risk</div><div className="mt-1 text-zinc-100">{progress.patterns.highestRisk}</div></div>
            </div>
          </Card>
          <Card title="Growth Themes">
            <div className="space-y-4">
              {progress.growthThemes.map(({ theme, value }) => (
                <div key={theme}>
                  <div className="mb-1 flex justify-between text-sm text-zinc-300">
                    <span>{theme}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                    <div className="h-full rounded-full bg-zinc-400" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Captured Truths">
            <div className="space-y-2 text-zinc-200">
              {data.notes.length ? data.notes.slice(-5).reverse().map((note) => (
                <div key={`${note.timestamp}-${note.text}`} className="rounded-2xl border border-zinc-800 bg-black px-3 py-3 text-sm">
                  <div className="text-zinc-500">{note.from} • {getRelativeTime(note.timestamp)}</div>
                  <div className="mt-1">{note.text}</div>
                </div>
              )) : <div className="text-zinc-500">No captured truths yet.</div>}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function TutorialOverlay() {
    if (data.tutorialSeen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">How to use this</div>
          <div className="mt-2 text-2xl font-semibold">Choose the lane that matches the moment.</div>
          <div className="mt-4 space-y-3 text-sm text-zinc-400">
            <div><span className="text-zinc-200">Trial</span> — something is actively pressing on you.</div>
            <div><span className="text-zinc-200">Mastery</span> — you did something that built you.</div>
            <div><span className="text-zinc-200">Regulate</span> — you feel off and need to stabilize.</div>
            <div><span className="text-zinc-200">Progress</span> — see what is changing.</div>
          </div>
          <div className="mt-5">
            <Button variant="accent" onClick={dismissTutorial}>Enter training</Button>
          </div>
        </div>
      </div>
    );
  }

  function InstallPromptBanner() {
    if (!installBannerVisible || !installPromptEvent) return null;

    return (
      <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="text-sm font-semibold text-zinc-100">Install Self Mastery</div>
          <div className="mt-1 text-sm text-zinc-400">Add this app to your home screen for faster access.</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={dismissInstallPrompt}
              className="rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-300"
            >
              Not now
            </button>
            <button
              onClick={installApp}
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-medium text-black"
            >
              Install app
            </button>
          </div>
        </div>
      </div>
    );
  }

  function HomeView() {
    return (
      <div>
        <div className="mb-8 mt-8">
          <div className="text-xs uppercase tracking-[0.25em] text-zinc-600">Current Insight</div>
          <div className="mt-3 max-w-sm text-2xl font-light leading-tight text-zinc-200">{insight}</div>
        </div>

        <div className="grid gap-3">
          <Button className="min-h-[88px]" onClick={() => resetFlow('trial')}>
            <div>
              <div className="text-lg font-semibold text-red-300">Trial</div>
              <div className="mt-1 text-sm text-zinc-500">Something is actively pressing on you.</div>
            </div>
          </Button>
          <Button className="min-h-[88px]" onClick={() => resetFlow('mastery')}>
            <div>
              <div className="text-lg font-semibold text-blue-300">Mastery</div>
              <div className="mt-1 text-sm text-zinc-500">Record a meaningful action that built you.</div>
            </div>
          </Button>
          <Button className="min-h-[88px]" onClick={() => resetFlow('regulate')}>
            <div>
              <div className="text-lg font-semibold text-emerald-300">Regulate</div>
              <div className="mt-1 text-sm text-zinc-500">Stabilize before it becomes a trial.</div>
            </div>
          </Button>
          <Button className="min-h-[88px]" onClick={() => resetFlow('progress')}>
            <div>
              <div className="text-lg font-semibold text-zinc-200">Progress</div>
              <div className="mt-1 text-sm text-zinc-500">See evidence that you are changing.</div>
            </div>
          </Button>
        </div>

        <div className="mt-6 grid gap-3">
          <Button variant="subtle" onClick={() => resetFlow('checkin')}>
            <div>
              <div className="text-sm font-medium text-zinc-300">Morning Check-In</div>
              <div className="mt-1 text-xs text-zinc-500">Energy, clarity, and risk in under 10 seconds.</div>
            </div>
          </Button>
          <div className="rounded-3xl border border-zinc-900 bg-zinc-950 px-4 py-4 text-sm text-zinc-500">
            {data.lastAction ? (
              <span>
                Last action: <span className="text-zinc-300 capitalize">{data.lastAction.kind}</span> • {getRelativeTime(data.lastAction.timestamp)}
              </span>
            ) : (
              <span>No recent action yet.</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const CurrentView = view === 'trial'
    ? TrialView
    : view === 'mastery'
      ? MasteryView
      : view === 'regulate'
        ? RegulateView
        : view === 'progress'
          ? ProgressView
          : view === 'checkin'
            ? CheckInView
            : HomeView;

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10 pt-4">
        <CurrentView />
      </div>
      <TutorialOverlay />
      <InstallPromptBanner />
    </div>
  );
}
