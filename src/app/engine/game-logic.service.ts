import { Injectable, signal, computed } from '@angular/core';

import { Monster } from '../models/monster';
import { Character } from '../models/characters';

@Injectable({
  providedIn: 'root'
})


export class GameLogicService {
  mana = signal(100);
  level = signal(1);
  isGameOver = signal(false);
  private _monsters = signal<Monster[]>([]);
  private _monstersToSpawn = signal(0);
  private _hunters = signal<Character[]>([]);

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

  // // Ein Wave-Objekt
  // currentWave = {
  //   monsterCount: 10,
  //   spawnInterval: 1.5, // Sekunden zwischen den Monstern
  //   monsterType: 'Goblin'
  // };

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
    // Spawning Logik
    if (this._monstersToSpawn() > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.5) { // Intervall
        this.spawnMonster();
        this._monstersToSpawn.update(n => n - 1);
        this.spawnTimer = 0;
      }
    }

    // Monster bewegen
    const currentMonsters = this._monsters();
    currentMonsters.forEach(m => m.update(dt, this.waypoints));

    // Tote/entkommene Monster entfernen & Signal aktualisieren
    this._monsters.set(currentMonsters.filter(m => m.isActive));

    // Hunter updaten
    const monsters = this._monsters();
    this._hunters().forEach(h => h.update(dt, monsters));

    this.mana.update(m => m + (2 * dt));
  }

  addHunter(x: number, y: number) {
    const newHunter = new Character(x, y);
    this._hunters.update(h => [...h, newHunter]);
  }

  // Hilfsmethode zum Testen
  private spawnMonster() {
    const start = this.waypoints[0];
    const newMonster = new Monster(start.x, start.y, {
      hp: 50, speed: 80, imgUrl: ''
    });
    // Signal updaten: Altes Array nehmen, neues Monster hinzufügen
    this._monsters.update(m => [...m, newMonster]);
    console.log("Monster gespawned! Anzahl aktuell:", this._monsters().length);
  }

  startWave() {
    if (this.isWaveRunning()) return; // Sicherheitscheck
    console.log('Die Gegener kommen!!!');

    this._monstersToSpawn.set(10); // 10 Monster für die Welle
    this.level.update(l => l + 1);
  }

  // Methode, die das Canvas-Zeichnen anstößt
  render(ctx: CanvasRenderingContext2D, slots: any[]) {
    ctx.clearRect(0, 0, 800, 600);

    // Zeichne den Pfad (als einfache graue Linie)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 40;
    ctx.beginPath();
    this.waypoints.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Zeichne die Tower-Slots
    slots.forEach(slot => {
      ctx.fillStyle = slot.occupied ? 'rgba(75, 0, 130, 0.5)' : 'rgba(0, 251, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00fbff';
      ctx.stroke();
    });

    // 4. Monster zeichnen
    const activeMonsters = this._monsters(); // Signal auslesen
    activeMonsters.forEach(m => {
      m.draw(ctx);
    });

    this._hunters().forEach(h => h.draw(ctx));
  }


}