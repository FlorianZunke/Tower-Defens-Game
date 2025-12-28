import { Injectable, signal } from '@angular/core';

import { Monster } from '../models/monster';

@Injectable({
  providedIn: 'root'
})


export class GameLogicService {
  mana = signal(100);
  level = signal(1);
  isGameOver = signal(false);

  public waypoints = [
    { x: 0, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 400 },
    { x: 800, y: 400 }
  ];

  public towerSlots = [
    { x: 150, y: 150, occupied: false },
    { x: 400, y: 300, occupied: false }
  ];

  // Ein Wave-Objekt
  currentWave = {
    monsterCount: 10,
    spawnInterval: 1.5, // Sekunden zwischen den Monstern
    monsterType: 'Goblin'
  };

  // Spiel-Daten
  private lastTime = 0;
  private monsters: Monster[] = [];

  constructor() { }

  // Startet den Loop
  startGameLoop() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(currentTime: number) {
    if (this.isGameOver()) return;

    // Zeitdifferenz berechnen (Delta Time), damit das Spiel 
    // auf allen PCs gleich schnell läuft
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);

    // Nächsten Frame anfordern
    requestAnimationFrame((time) => this.loop(time));
  }

  private update(dt: number) {
    this.monsters.forEach(m => m.update(dt, this.waypoints));
    this.monsters = this.monsters.filter(m => m.isActive);

    this.mana.update(m => m + (1 * dt));
  }

  // Methode, die das Canvas-Zeichnen anstößt
  render(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, 800, 600); // Canvas leeren
    this.monsters.forEach(m => m.draw(ctx));
  }

  // Hilfsmethode zum Testen
  spawnTestMonster() {
    const start = this.waypoints[0];
    this.monsters.push(new Monster(start.x, start.y, { 
      hp: 100, 
      speed: 50, 
      imgUrl: '/images/monsters/Hallokin/idle.png' 
    }));
  }
}