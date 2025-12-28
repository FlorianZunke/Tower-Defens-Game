// src/app/models/character.ts
export class Character {
  x: number;
  y: number;
  range: number = 150;     // Wie weit kann er schießen?
  damage: number = 10;     // Schaden pro Treffer
  cooldown: number = 1.0;  // Sekunden zwischen Schüssen
  lastShotTime: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, activeMonsters: any[]) {
    this.lastShotTime += dt;

    if (this.lastShotTime >= this.cooldown) {
      // Ziel suchen (das erste Monster in Reichweite)
      const target = activeMonsters.find(m => {
        const dist = Math.sqrt((m.x - this.x)**2 + (m.y - this.y)**2);
        return dist <= this.range;
      });

      if (target) {
        this.shoot(target);
        this.lastShotTime = 0;
      }
    }
  }

  shoot(target: any) {
    target.hp -= this.damage;
    if (target.hp <= 0) target.isActive = false;
    console.log("Schatten-Soldat greift an!");
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Zeichne den Hunter (Violetter Kreis für den Schatten)
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4b0082';
    ctx.fillStyle = '#4b0082';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Reichweite-Indikator (optional, dezent)
    ctx.strokeStyle = 'rgba(75, 0, 130, 0.2)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}