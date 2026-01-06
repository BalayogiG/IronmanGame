import React, { useState, useEffect, useCallback, useRef } from 'react';
import ironmanImg from "/ironman_player.png";

// --- Constants (1.5x Overclocked) ---
const MOVE_SPEED = 9;
const SCROLL_SPEED = 6;
const OBSTACLE_WIDTH = 100;
const OBSTACLE_GAP = 220;
const SPAWN_RATE = 1333;
const PLAYER_WIDTH = 110;  // Adjusted for image proportions
const PLAYER_HEIGHT = 65;

// --- Background Themes ---
const THEMES = [
  { name: 'Deep Space', bg: '#020617', accent: '#38bdf8', secondary: '#1e293b' },
  { name: 'Mars Orbit', bg: '#1a0a05', accent: '#f97316', secondary: '#451a03' },
  { name: 'Nebula Sector', bg: '#0f0720', accent: '#d946ef', secondary: '#2e1065' },
  { name: 'Deep Tech', bg: '#061717', accent: '#2dd4bf', secondary: '#115e59' },
  { name: 'Sunset Horizon', bg: '#1c1917', accent: '#fbbf24', secondary: '#44403c' }
];

// --- Image-Based Iron Man Character ---
const IronManCharacter = ({ velocityX, velocityY, themeAccent }) => {
  const tiltY = velocityY * 2.5;
  const isMovingBack = velocityX < 0;
  
  // NOTE: Replace this URL with your uploaded image URL or local path
  const characterImageUrl = ironmanImg;

  return (
    <div 
      className="w-full h-full transition-transform duration-150 ease-out relative"
      style={{ 
        transform: `rotate(${tiltY}deg) scaleX(${isMovingBack ? -1 : 1})`,
      }}
    >
      {/* Thruster Glow Effect (Behind Image) */}
      <div 
        className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-16 h-8 blur-lg opacity-60 animate-pulse"
        style={{ backgroundColor: themeAccent }}
      />
      
      <img 
        src={characterImageUrl}
        alt="Iron Man"
        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]"
        onError={(e) => {
          // Fallback if image fails to load
          e.target.style.display = 'none';
        }}
      />
      
      {/* Dynamic Arc Reactor Overlay Glow */}
      <div 
        className="absolute top-[40%] left-[65%] w-3 h-3 rounded-full blur-[2px] bg-white opacity-80 animate-pulse"
        style={{ boxShadow: `0 0 10px 2px ${themeAccent}` }}
      />
    </div>
  );
};

const Asteroid = ({ themeAccent }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
    <path 
      d="M30 10 Q50 0 70 10 L90 30 Q100 50 90 70 L70 90 Q50 100 30 90 L10 70 Q0 50 10 30 Z" 
      fill="#1e293b" 
      stroke={themeAccent} 
      strokeWidth="1" 
      opacity="0.9"
    />
    <circle cx="40" cy="30" r="10" fill="#0f172a" opacity="0.6" />
    <circle cx="70" cy="60" r="15" fill="#0f172a" opacity="0.6" />
  </svg>
);

export default function App() {
  const [gameState, setGameState] = useState('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [pos, setPos] = useState({ x: 100, y: 300 });
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [bgIndex, setBgIndex] = useState(0);
  
  const [obstacles, setObstacles] = useState([]);
  const [bgOffset, setBgOffset] = useState(0);
  
  const gameLoopRef = useRef();
  const lastObstacleTime = useRef(0);
  const keysPressed = useRef(new Set());

  const currentTheme = THEMES[bgIndex];

  useEffect(() => {
    const handleKeyDown = (e) => keysPressed.current.add(e.key.toLowerCase());
    const handleKeyUp = (e) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle background switching every 5 points
  useEffect(() => {
    if (score > 0 && score % 5 === 0) {
      const nextIndex = Math.floor(score / 5) % THEMES.length;
      if (nextIndex !== bgIndex) setBgIndex(nextIndex);
    }
  }, [score, bgIndex]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setBgIndex(0);
    setPos({ x: 150, y: 300 });
    setVelocity({ x: 0, y: 0 });
    setObstacles([]);
    lastObstacleTime.current = Date.now();
  };

  const update = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Movement
    const newVel = { x: 0, y: 0 };
    if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) newVel.y -= MOVE_SPEED;
    if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) newVel.y += MOVE_SPEED;
    if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) newVel.x -= MOVE_SPEED;
    if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) newVel.x += MOVE_SPEED;

    setVelocity(newVel);
    setPos(prev => {
      const nextX = Math.max(20, Math.min(window.innerWidth - PLAYER_WIDTH, prev.x + newVel.x));
      const nextY = Math.max(20, Math.min(window.innerHeight - PLAYER_HEIGHT, prev.y + newVel.y));
      return { x: nextX, y: nextY };
    });

    // Obstacles
    setObstacles(prev => {
      const now = Date.now();
      let next = prev.map(obs => ({ ...obs, x: obs.x - SCROLL_SPEED }))
                     .filter(obs => obs.x > -OBSTACLE_WIDTH);

      if (now - lastObstacleTime.current > SPAWN_RATE) {
        const height = Math.random() * (window.innerHeight - OBSTACLE_GAP - 150) + 75;
        next.push({ id: now, x: window.innerWidth, topHeight: height, passed: false });
        lastObstacleTime.current = now;
      }

      const pRect = { 
        left: pos.x + 25, 
        right: pos.x + PLAYER_WIDTH - 25, 
        top: pos.y + 15, 
        bottom: pos.y + PLAYER_HEIGHT - 15 
      };

      for (let obs of next) {
        if (pRect.right > obs.x + 10 && pRect.left < obs.x + OBSTACLE_WIDTH - 10) {
            if (pRect.top < obs.topHeight || pRect.bottom > obs.topHeight + OBSTACLE_GAP) {
                setGameState('GAMEOVER');
            }
        }
        if (!obs.passed && obs.x + OBSTACLE_WIDTH < pRect.left) {
            obs.passed = true;
            setScore(s => s + 1);
        }
      }
      return next;
    });

    setBgOffset(prev => (prev - SCROLL_SPEED / 2) % 1000);
    gameLoopRef.current = requestAnimationFrame(update);
  }, [gameState, pos]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(gameLoopRef.current);
    }
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, update]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden font-sans select-none transition-colors duration-1000"
      style={{ backgroundColor: currentTheme.bg }}
    >
      {/* Stars Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(60)].map((_, i) => (
          <div 
            key={i} 
            className="absolute rounded-full opacity-30 animate-pulse"
            style={{
              backgroundColor: i % 2 === 0 ? '#fff' : currentTheme.accent,
              width: Math.random() * 3,
              height: Math.random() * 3,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Large Theme Name Label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <span className="text-[120px] font-black text-white/5 uppercase italic tracking-tighter">
          {currentTheme.name}
        </span>
      </div>

      {/* HUD Scoreboard */}
      <div className="absolute top-10 left-0 right-0 flex justify-center z-30">
        <div 
          className="bg-black/60 backdrop-blur-xl border px-12 py-4 rounded-3xl flex gap-16 items-center shadow-2xl transition-colors duration-500"
          style={{ borderColor: `${currentTheme.accent}33` }}
        >
          <div className="text-center">
            <p className="text-[9px] font-bold tracking-[0.4em] uppercase opacity-60 mb-1" style={{ color: currentTheme.accent }}>Sector Depth</p>
            <p className="text-white text-5xl font-black tabular-nums">{score}</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-center">
            <p className="text-amber-500 text-[9px] font-bold tracking-[0.4em] uppercase opacity-60 mb-1">High Record</p>
            <p className="text-white text-5xl font-black tabular-nums">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Player (Iron Man Image) */}
      <div 
        className="absolute z-20 pointer-events-none"
        style={{ 
          left: pos.x, 
          top: pos.y, 
          width: PLAYER_WIDTH, 
          height: PLAYER_HEIGHT,
        }}
      >
        <IronManCharacter velocityX={velocity.x} velocityY={velocity.y} themeAccent={currentTheme.accent} />
      </div>

      {/* Obstacles */}
      {obstacles.map(obs => (
        <React.Fragment key={obs.id}>
            <div className="absolute" style={{ left: obs.x, top: 0, width: OBSTACLE_WIDTH, height: obs.topHeight }}>
              <div className="w-full h-full bg-gradient-to-b from-black/80 to-transparent flex items-end justify-center pb-4">
                <div className="w-24 h-24 transform rotate-180"><Asteroid themeAccent={currentTheme.accent} /></div>
              </div>
            </div>
            <div className="absolute" style={{ left: obs.x, top: obs.topHeight + OBSTACLE_GAP, width: OBSTACLE_WIDTH, height: window.innerHeight }}>
              <div className="w-full h-full bg-gradient-to-t from-black/80 to-transparent flex items-start justify-center pt-4">
                <div className="w-28 h-28"><Asteroid themeAccent={currentTheme.accent} /></div>
              </div>
            </div>
        </React.Fragment>
      ))}

      {/* Start UI */}
      {gameState === 'START' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in duration-700">
          <div className="w-48 h-24 mb-16 animate-pulse">
             <IronManCharacter velocityX={1} velocityY={0} themeAccent="#38bdf8" />
          </div>
          <h1 className="text-8xl font-black text-white italic tracking-tighter mb-4">IRONMAN GAME</h1>
          <p className="text-sky-400 font-bold mb-20 text-xs uppercase tracking-[0.8em] opacity-80">Full Visual Integration: Active</p>
          <button 
            onClick={startGame}
            className="bg-red-600 text-white px-24 py-6 font-black text-3xl transition-all hover:bg-red-500 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
          >
            ENGAGE MISSION
          </button>
        </div>
      )}

      {/* Game Over UI */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-red-950/40 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#020617] p-16 border-t-4 border-b-4 text-center shadow-2xl max-w-lg w-full" style={{ borderColor: currentTheme.accent }}>
            <p className="text-red-500 text-xs font-bold tracking-[0.6em] uppercase mb-6">Visual Feed Lost</p>
            <h3 className="text-5xl font-black text-white mb-4">REBOOT_REQUIRED</h3>
            <div className="text-8xl font-black text-white mb-12 py-6 border-y border-white/10">{score}</div>
            <button 
                onClick={startGame}
                className="w-full bg-white text-black px-10 py-6 font-black text-2xl hover:bg-sky-400 hover:text-white transition-all transform hover:scale-105"
            >
              DEPLOY NEW CHASSIS
            </button>
          </div>
        </div>
      )}

      {/* Diagnostic HUD Decor */}
      <div className="absolute bottom-10 left-10 text-[9px] font-mono tracking-widest uppercase opacity-40 leading-relaxed" style={{ color: currentTheme.accent }}>
        CHARACTER: IMAGE_MODE<br/>
        SECTOR: {currentTheme.name}<br/>
        LATENCY: 1.5ms
      </div>
      <div className="absolute bottom-10 right-10 text-[9px] font-mono tracking-widest uppercase text-right opacity-40 leading-relaxed" style={{ color: currentTheme.accent }}>
        THRUSTERS: {SCROLL_SPEED} MACH<br/>
        STARK_LINK: NOMINAL<br/>
        ITERATION: {bgIndex + 1}/{THEMES.length}
      </div>
    </div>
  );
}