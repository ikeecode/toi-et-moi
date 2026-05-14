'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Calculator, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type GameTab = 'quiz' | 'math';

interface QuizItem {
  question: string;
  choices: string[];
  answer: number;
}

const QUIZ_BANK: QuizItem[] = [
  {
    question: 'Quelle est la capitale du Sénégal ?',
    choices: ['Thiès', 'Saint-Louis', 'Dakar', 'Touba'],
    answer: 2,
  },
  {
    question: 'Combien y a-t-il de continents sur Terre ?',
    choices: ['5', '6', '7', '8'],
    answer: 2,
  },
  {
    question: 'Quelle planète est la plus proche du Soleil ?',
    choices: ['Vénus', 'Mercure', 'Mars', 'Terre'],
    answer: 1,
  },
  {
    question: 'Combien de cœurs a une pieuvre ?',
    choices: ['1', '2', '3', '4'],
    answer: 2,
  },
  {
    question: 'Qui a peint la Joconde ?',
    choices: ['Michel-Ange', 'Léonard de Vinci', 'Raphaël', 'Picasso'],
    answer: 1,
  },
  {
    question: 'Quelle est la plus longue rivière d’Afrique ?',
    choices: ['Le Niger', 'Le Congo', 'Le Sénégal', 'Le Nil'],
    answer: 3,
  },
  {
    question: 'Combien fait 7 × 8 ?',
    choices: ['54', '56', '58', '64'],
    answer: 1,
  },
  {
    question: 'Quel est l’élément chimique de symbole « Au » ?',
    choices: ['Argent', 'Or', 'Aluminium', 'Cuivre'],
    answer: 1,
  },
  {
    question: 'En quelle année le Sénégal a-t-il accédé à l’indépendance ?',
    choices: ['1958', '1960', '1962', '1965'],
    answer: 1,
  },
  {
    question: 'Combien d’os contient le corps humain adulte ?',
    choices: ['186', '206', '226', '256'],
    answer: 1,
  },
  {
    question: 'Quel océan borde l’ouest de l’Afrique ?',
    choices: ['Indien', 'Atlantique', 'Pacifique', 'Arctique'],
    answer: 1,
  },
  {
    question: 'En wolof, « sama xol » signifie…',
    choices: ['ma maison', 'mon cœur', 'mon ami', 'mon trésor'],
    answer: 1,
  },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function OfflineGames() {
  const [tab, setTab] = useState<GameTab>('quiz');

  return (
    <div className="mx-auto flex min-h-[100svh] w-full max-w-xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
          <WifiOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Hors ligne
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Pas de connexion pour le moment. En attendant, un petit jeu ?
        </p>
      </header>

      <div className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
        <button
          type="button"
          onClick={() => setTab('quiz')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
            tab === 'quiz' ? 'bg-white text-[#0b0d12]' : 'text-muted-foreground'
          )}
        >
          <Brain className="h-4 w-4" /> Quiz
        </button>
        <button
          type="button"
          onClick={() => setTab('math')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
            tab === 'math' ? 'bg-white text-[#0b0d12]' : 'text-muted-foreground'
          )}
        >
          <Calculator className="h-4 w-4" /> Calcul mental
        </button>
      </div>

      {tab === 'quiz' ? <QuizGame /> : <MathGame />}
    </div>
  );
}

function QuizGame() {
  const [deck, setDeck] = useState<QuizItem[]>(() => shuffle(QUIZ_BANK).slice(0, 10));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const current = deck[index];
  const isDone = index >= deck.length;

  function handlePick(choiceIdx: number) {
    if (picked !== null) return;
    setPicked(choiceIdx);
    if (choiceIdx === current.answer) setScore((s) => s + 1);
  }

  function handleNext() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  function handleRestart() {
    setDeck(shuffle(QUIZ_BANK).slice(0, 10));
    setIndex(0);
    setScore(0);
    setPicked(null);
  }

  if (isDone) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm text-muted-foreground">Score</p>
        <p className="text-4xl font-semibold text-foreground">
          {score} / {deck.length}
        </p>
        <p className="text-sm text-muted-foreground">
          {score >= 8
            ? 'Impressionnant.'
            : score >= 5
              ? 'Pas mal du tout.'
              : 'Encore un essai ?'}
        </p>
        <button
          type="button"
          onClick={handleRestart}
          className="cta-primary mt-2 h-11 px-6"
        >
          <RefreshCw className="h-4 w-4" /> Rejouer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {index + 1} / {deck.length}
        </span>
        <span>Score : {score}</span>
      </div>
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
        <p className="text-base font-semibold leading-snug text-foreground">
          {current.question}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {current.choices.map((choice, i) => {
          const isCorrect = i === current.answer;
          const isPicked = picked === i;
          const showResult = picked !== null;
          return (
            <button
              key={i}
              type="button"
              disabled={showResult}
              onClick={() => handlePick(i)}
              className={cn(
                'rounded-[1.2rem] border px-4 py-3 text-left text-sm transition-colors',
                showResult
                  ? isCorrect
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-foreground'
                    : isPicked
                      ? 'border-red-400/50 bg-red-500/15 text-foreground'
                      : 'border-white/10 bg-white/[0.02] text-muted-foreground'
                  : 'border-white/10 bg-white/[0.02] text-foreground hover:bg-white/[0.06]'
              )}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <button
          type="button"
          onClick={handleNext}
          className="cta-primary h-11"
        >
          {index + 1 === deck.length ? 'Voir le score' : 'Question suivante'}
        </button>
      )}
    </div>
  );
}

interface MathProblem {
  text: string;
  answer: number;
}

function generateProblem(): MathProblem {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let answer = 0;
  if (op === '+') {
    a = Math.floor(Math.random() * 90) + 10;
    b = Math.floor(Math.random() * 90) + 10;
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 90) + 10;
    b = Math.floor(Math.random() * a);
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 11) + 2;
    b = Math.floor(Math.random() * 11) + 2;
    answer = a * b;
  }
  return { text: `${a} ${op} ${b}`, answer };
}

function MathGame() {
  const ROUND_SECONDS = 60;
  const [problem, setProblem] = useState<MathProblem>(() => generateProblem());
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bestScore = useMemo(() => {
    if (typeof window === 'undefined') return 0;
    return Number(window.localStorage.getItem('toi-et-moi-math-best') ?? 0);
  }, []);
  const [best, setBest] = useState(bestScore);

  const stop = useCallback(() => {
    setRunning(false);
    setScore((current) => {
      setBest((prevBest) => {
        if (current > prevBest) {
          window.localStorage.setItem('toi-et-moi-math-best', String(current));
          return current;
        }
        return prevBest;
      });
      return current;
    });
  }, []);

  useEffect(() => {
    if (!running) return;
    if (timeLeft <= 0) {
      stop();
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, timeLeft, stop]);

  function start() {
    setScore(0);
    setMisses(0);
    setTimeLeft(ROUND_SECONDS);
    setProblem(generateProblem());
    setInput('');
    setRunning(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!running) return;
    const parsed = Number(input.trim());
    if (Number.isNaN(parsed)) return;
    if (parsed === problem.answer) {
      setScore((s) => s + 1);
    } else {
      setMisses((m) => m + 1);
    }
    setProblem(generateProblem());
    setInput('');
  }

  if (!running && timeLeft === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-sm text-muted-foreground">Temps écoulé</p>
        <p className="text-4xl font-semibold text-foreground">{score}</p>
        <p className="text-xs text-muted-foreground">
          bonnes réponses · {misses} erreur{misses > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          Meilleur score : <span className="text-foreground">{best}</span>
        </p>
        <button type="button" onClick={start} className="cta-primary mt-2 h-11 px-6">
          <RefreshCw className="h-4 w-4" /> Rejouer
        </button>
      </div>
    );
  }

  if (!running) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-base font-semibold text-foreground">Calcul mental</p>
        <p className="text-xs text-muted-foreground">
          60 secondes pour enchaîner un maximum de calculs.
        </p>
        <p className="text-xs text-muted-foreground">
          Meilleur score : <span className="text-foreground">{best}</span>
        </p>
        <button type="button" onClick={start} className="cta-primary mt-2 h-11 px-6">
          Commencer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Score : {score}</span>
        <span>{timeLeft}s</span>
      </div>
      <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-4xl font-semibold tracking-tight text-foreground">
          {problem.text}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Réponse…"
          className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-5 text-center text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          autoFocus
        />
        <button type="submit" className="cta-primary h-12 px-5">
          OK
        </button>
      </form>
      <p className="text-center text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground/80">
        Entrée pour valider
      </p>
    </div>
  );
}
