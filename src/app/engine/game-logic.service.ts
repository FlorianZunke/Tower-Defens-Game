import { Injectable, signal, computed } from '@angular/core';

import { Monster } from '../models/monster';
import { Character } from '../models/characters';

@Injectable({
  providedIn: 'root'
})


export class GameLogicService {
  mana = signal(100);
  lives = signal(10);
  level = signal(1);
  isGameOver = signal(false);
  currentWaveStats = { hp: 50, speed: 80, count: 10, reward: 20 };
  private _monsters = signal<Monster[]>([]);
  private _monstersToSpawn = signal(0);
  private _characters = signal<Character[]>([]);

  isWaveRunning = computed(() => this._monsters().length > 0 || this._monstersToSpawn() > 0)

  // Spiel-Daten
  private lastTime = 0;
  private spawnTimer = 0;

  public waypoints = [
    { x: 0, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 400 },
    { x: 800, y: 400 }
  ];

  constructor() { }

  // Startet den Loop
  startGameLoop() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(currentTime: number) {
    if (this.isGameOver()) return;

    // SICHERHEITS-CHECK: Falls lastTime 0 ist, dt auf 0 setzen
    if (!this.lastTime) this.lastTime = currentTime;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // dt darf nicht NaN oder unendlich sein
    if (isNaN(deltaTime) || deltaTime > 0.1) {
      requestAnimationFrame((time) => this.loop(time));
      return;
    }

    this.update(deltaTime);
    requestAnimationFrame((time) => this.loop(time));
  }

  private update(dt: number) {
    // 1. Spawning Logik (Bleibt gleich)
    if (this._monstersToSpawn() > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.5) {
        this.spawnMonster();
        this._monstersToSpawn.update(n => n - 1);
        this.spawnTimer = 0;
      }
    }

    // 2. Monster bewegen
    const currentMonsters = this._monsters();
    currentMonsters.forEach(m => m.update(dt, this.waypoints));

    // 3. Status prüfen (Tot oder Entkommen?)
    // Wir gehen durch ALLE Monster und schauen, wer gerade inaktiv geworden ist
    currentMonsters.forEach(m => {
      // Nur reagieren, wenn das Monster gerade fertig ist (nicht mehr aktiv)
      if (!m.isActive) {

        if (m.hp <= 0) {
          // FALL A: BESIEGT (Mana Belohnung)
          // Prüfen wir, ob wir das Mana schon gegeben haben (optional, aber sicher)
          this.mana.update(curr => curr + 20);
          console.log("Essenzstein erhalten! +20 Mana");

        } else {
          // FALL B: ENTKOMMEN (Leben abziehen)
          // Das Monster lebt noch, ist aber am Ziel angekommen
          this.lives.update(l => l - 1);
          console.log("Monster entkommen! Leben verloren.");

          // Game Over Check
          if (this.lives() <= 0) {
            this.triggerGameOver();
          }
        }
      }
    });

    // 4. Liste säubern (Nur noch aktive Monster behalten)
    // Da "isActive" in der Loop oben false wurde (durch Tod oder Ziel), fliegen sie hier raus
    this._monsters.set(currentMonsters.filter(m => m.isActive));

    // 5. Characters schießen lassen
    // Wir nutzen das gefilterte, frische Array
    const activeMonsters = this._monsters();
    this._characters().forEach(h => h.update(dt, activeMonsters));

    // 6. Mana Regeneration (nur während Welle und wenn nicht Game Over)
    if (this.isWaveRunning() && this.lives() > 0) {
      this.mana.update(m => m + (5 * dt));
    }
  }

  addCharacter(x: number, y: number, type: 'RANGED' | 'MELEE') {
    const newCharacter = new Character(x, y, type);
    this._characters.update(h => [...h, newCharacter]);
  }

  // Methode zum Monsterspawnen
  private spawnMonster() {
    const start = this.waypoints[0];
    const newMonster = new Monster(start.x, start.y, {
      hp: this.currentWaveStats.hp,     // Dynamische HP
      speed: this.currentWaveStats.speed, // Dynamischer Speed
      imgUrl: ''
    });
    this._monsters.update(m => [...m, newMonster]);
  }

  // Hilfsmethode für Game Over
  private triggerGameOver() {
    this.isGameOver.set(true);
    console.log("GAME OVER - Die Schattenarmee ist gefallen.");
    // Hier könnten wir später den Loop stoppen
  }

  //Methode zum Starten einer neuen Welle
  startWave() {
    if (this.isWaveRunning()) return;

    // 1. Level erhöhen
    this.level.update(l => l + 1);

    // 2. Werte für dieses Level berechnen
    // Wir nutzen einfache Formeln: HP wächst exponentiell, Speed linear
    const lvl = this.level();

    this.currentWaveStats.hp = Math.floor(50 * Math.pow(1.2, lvl));
    this.currentWaveStats.speed = Math.min(200, 80 + (lvl * 5));
    this.currentWaveStats.count = 10 + Math.floor(lvl / 2);

    // 3. Spawner "scharf schalten"
    this._monstersToSpawn.set(this.currentWaveStats.count);

    console.log(`Welle ${lvl} gestartet! HP: ${this.currentWaveStats.hp}`);
  }


  // Methode, die die Stats der nächsten Welle zurückgibt
  getNextWaveStats() {
    const nextLevel = this.level() + 1;
    return {
      hp: Math.floor(50 * Math.pow(1.2, nextLevel)), // +20% HP pro Level
      speed: Math.min(200, 80 + (nextLevel * 5)),   // Speed cap bei 200
      count: 10 + Math.floor(nextLevel / 2)         // Alle 2 Level ein Monster mehr
    };
  }



  // Methode, die das Canvas-Zeichnen anstößt
  render(ctx: CanvasRenderingContext2D, towerSlots: any[], hoveredSlot: any, selectedType: 'MELEE' | 'RANGED') {
    // 1. Spielfeld leeren/Hintergrund zeichnen
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 800, 600);

    // 2. Wegpunkte/Pfad und Towerslots zeichnen (optional, aber hilfreich)
    this.drawPath(ctx);
    this.drawTowerSlots(ctx, towerSlots);

    // 3. Bestehende Hunter (Schatten) zeichnen
    this._characters().forEach(h => h.draw(ctx));

    // 4. Aktive Monster zeichnen
    this._monsters().forEach(m => m.draw(ctx));

    // 5. REICHWEITE-VORSCHAU (Das neue Feature)
    if (hoveredSlot && !hoveredSlot.occupied) {
      this.drawRangePreview(ctx, hoveredSlot, selectedType);
    }
  }

  private drawRangePreview(ctx: CanvasRenderingContext2D, slot: any, type: string) {
    const range = type === 'MELEE' ? 60 : 250;

    ctx.save();
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, range, 0, Math.PI * 2);

    // Farben passend zum Solo Leveling Theme (Violett vs. Blau)
    ctx.fillStyle = type === 'MELEE' ? 'rgba(138, 43, 226, 0.2)' : 'rgba(0, 191, 255, 0.15)';
    ctx.fill();

    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = type === 'MELEE' ? '#8A2BE2' : '#00BFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  private drawPath(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    this.waypoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  private drawTowerSlots(ctx: CanvasRenderingContext2D, towerSlots: any[]) {
    towerSlots.forEach(slot => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = slot.occupied ? '#8B4513' : '#A9A9A9';
      ctx.fill();
      ctx.restore();
    });
  }
}