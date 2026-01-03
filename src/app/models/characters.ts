import { Monster } from './monster'; // Pfad ggf. anpassen

export type CharacterType = 'MELEE' | 'RANGED';

export class Character {
  x: number;
  y: number;
  type: CharacterType;

  // Kampf-Stats
  range: number;
  damage: number;
  cooldown: number;
  lastShotTime: number = 0;

  // SPRITE / ANIMATION CONFIG
  private spriteSheet: HTMLImageElement;

  // WICHTIG: Die Größe eines einzelnen "Kästchens" auf dem Bild.
  // Bei diesem Art-Style (Tiny Swords) sind es oft 192px pro Bild oder 64px/128px.
  // Wir testen mal 100x100. Falls es "rutscht", müssen wir diesen Wert anpassen.
  private frameWidth = 100;
  private frameHeight = 100;



  // Animations-Status
  private frameX = 0;       // Horizontale Position (0 bis maxFrames)
  private frameY = 0;       // Vertikale Position (Die Reihe)
  private minFrame = 0;
  private maxFrames = 5;    // Wie viele Bilder hat die Animation? (Start bei 0)
  private fps = 15;         // Geschwindigkeit der Animation
  private frameTimer = 0;
  private frameInterval = 1000 / this.fps;

  // Logik Flags
  private isAttacking = false;
  private target: Monster | null = null;
  private damageDealtInThisAnimation = false; // Damit wir pro Schlag nur 1x Schaden machen

  constructor(x: number, y: number, type: CharacterType) {
    this.x = x;
    this.y = y;
    this.type = type;

    // Bild laden
    this.spriteSheet = new Image();
    this.spriteSheet.src = 'assets/characters/Soldier.png'; // Stelle sicher, dass das Bild dort liegt!

    if (type === 'MELEE') {
      this.range = 80;    // Nahkampf Reichweite
      this.damage = 45;
      this.cooldown = 0.8;
      this.frameY = 2;    // Start: Idle Reihe (0)
      this.minFrame = 1;
      this.maxFrames = 1;
      this.frameX = 1;
    } else {
      this.range = 300;   // Fernkampf Reichweite
      this.damage = 25;
      this.cooldown = 1.2;
      this.frameY = 0;    // Start: Idle Reihe (0)
    }
  }

  update(dt: number, activeMonsters: Monster[], onShoot?: (target: Monster, damage: number) => void) {
    // 1. ANIMATION TIMER (bleibt gleich)
    this.frameTimer += dt * 1000;
    if (this.frameTimer > this.frameInterval) {
      if (this.frameX < this.maxFrames) {
        this.frameX++;
      } else {
        this.frameX = this.minFrame;
        if (this.isAttacking) {
          this.resetToIdle();
        }
      }
      this.frameTimer = 0;
    }

    // 2. LOGIK
    if (!this.isAttacking) {
      this.lastShotTime += dt;
      if (this.lastShotTime >= this.cooldown) {
        // NUR MONSTER SUCHEN, DIE NOCH AKTIV SIND UND HP > 0 HABEN
        const target = activeMonsters.find(m => {
          const dist = Math.sqrt((m.x - this.x) ** 2 + (m.y - this.y) ** 2);
          return dist <= this.range && m.isActive && m.hp > 0;
        });

        if (target) {
          this.startAttack(target);
        }
      }
    } else if (this.isAttacking && this.target && !this.damageDealtInThisAnimation) {

      // ZIEL-CHECK: Wenn das Monster stirbt, während wir gerade ausholen
      if (!this.target.isActive || this.target.hp <= 0) {
        this.resetToIdle(); // Abbruch
        return;
      }

      if (this.frameX === 3) {
        if (this.type === 'MELEE') {
          this.dealDamage(this.target);
        } else {
          if (onShoot) {
            onShoot(this.target, this.damage);
          }
        }
        this.damageDealtInThisAnimation = true;
      }
    }
  }

  private resetToIdle() {
    this.isAttacking = false;
    this.target = null;

    if (this.type === 'MELEE') {
      // ZURÜCK ZUM SCHWERT-HALTEN
      this.frameY = 2;     // Gleiche Reihe
      this.minFrame = 1;   // Aber nur ab Bild 2
      this.maxFrames = 1;  // Und nicht weiter laufen
      this.frameX = 1;     // Position setzen
    } else {
      // Standard Idle
      this.frameY = 0;
      this.minFrame = 0;
      this.maxFrames = 5;
    }
  }

  private startAttack(target: Monster) {
    this.isAttacking = true;
    this.target = target;
    this.lastShotTime = 0;
    this.damageDealtInThisAnimation = false;

    if (this.type === 'MELEE') {
      // ANGRIFFS ANIMATION
      // Wir nutzen die GANZE Reihe 3 (Index 2) von vorne bis hinten
      this.frameY = 2;
      this.minFrame = 0; // Start ganz links
      this.maxFrames = 5; // Bis zum Ende durchziehen
      this.frameX = 0; // Sofort auf Frame 0 setzen
    } else {
      // Fernkampf Logik kommt später...
    }
  }

  private dealDamage(target: Monster) {
    // Hier ziehen wir die HP ab
    target.hp -= this.damage;
    console.log(`${this.type} trifft! HP übrig: ${target.hp}`);

    // Sofort-Check: Ist es jetzt tot?
    if (target.hp <= 0) {
      target.isActive = false; 
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.spriteSheet.complete) return;

    // Position auf dem Sprite Sheet berechnen
    const sx = this.frameX * this.frameWidth;
    const sy = this.frameY * this.frameHeight;

    ctx.save();

    // Das hilft extrem, um frameWidth/frameHeight richtig einzustellen!
    ctx.strokeStyle = 'red';
    ctx.strokeRect(this.x - 50, this.y - 50, 100, 100);

    // Wir zeichnen das Bild zentriert auf die Koordinaten (x,y)
    // Destination (dx, dy) = x - halbeBreite, y - halbeHöhe
    const drawSize = 120; // Wie groß soll er auf dem Screen sein?
    const offset = drawSize / 2;

    ctx.drawImage(
      this.spriteSheet,
      sx, sy, this.frameWidth, this.frameHeight, // SOURCE (Ausschnitt)
      this.x - offset, this.y - offset, drawSize, drawSize // DESTINATION (Canvas)
    );

    ctx.restore();

    // Reichweite bei Hover (Optional, falls du das Logic im Service lässt, brauchst du es hier nicht)
    // Aber Lebensbalken oder ähnliches könnte hier hin.
  }
}