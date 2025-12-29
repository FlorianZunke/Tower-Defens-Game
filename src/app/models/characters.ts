export type characterType = 'MELEE' | 'RANGED';
export class Character {
  type: characterType;
  x: number;
  y: number;
  range: number;
  damage: number;
  cooldown: number;
  lastShotTime: number = 0;

  // Für die Animation
  isAttacking: boolean = false;
  attackAnimTimer: number = 0;
  currentTargetPos: { x: number, y: number } | null = null;

  constructor(x: number, y: number, type: characterType) {
    this.x = x;
    this.y = y;
    this.type = type;

    if (type === 'MELEE') {
      this.range = 60;   // Kurze Reichweite für Schwertkämpfer
      this.damage = 25;  // Hoher Schaden
      this.cooldown = 0.8;
    } else {
      this.range = 250;  // Hohe Reichweite für Magier
      this.damage = 12;  // Weniger Schaden pro Treffer
      this.cooldown = 1.5;
    }
  }

  update(dt: number, activeMonsters: any[]) {
    this.lastShotTime += dt;

    // Timer für die visuelle Animation (0.2 Sekunden Dauer)
    if (this.isAttacking) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) this.isAttacking = false;
    }

    if (this.lastShotTime >= this.cooldown) {
      const target = activeMonsters.find(m => {
        const dist = Math.sqrt((m.x - this.x) ** 2 + (m.y - this.y) ** 2);
        return dist <= this.range;
      });

      if (target) {
        this.performAttack(target);
        this.lastShotTime = 0;
      }
    }
  }

  performAttack(target: any) {
    this.isAttacking = true;
    this.attackAnimTimer = 0.2; // Wie lange der Effekt sichtbar bleibt
    this.currentTargetPos = { x: target.x, y: target.y };

    target.hp -= this.damage;
    if (target.hp <= 0) target.isActive = false;
  }

  shoot(target: any) {
    target.hp -= this.damage;
    if (target.hp <= 0) target.isActive = false;
    console.log("Schatten-Soldat greift an!");
  }

  draw(ctx: CanvasRenderingContext2D) {
    // 1. Zeichne den Hunter-Körper (wie zuvor)
    ctx.save();
    ctx.fillStyle = this.type === 'MELEE' ? '#4b0082' : '#0000ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Animation zeichnen, wenn er gerade angreift
    if (this.isAttacking && this.currentTargetPos) {
      ctx.save();
      ctx.strokeStyle = '#00fbff'; // Solo Leveling Blau
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00fbff';

      if (this.type === 'MELEE') {
        // NAHKAMPF: Ein kurzer "Swoosh" oder Schwertstreich-Bogen
        ctx.beginPath();
        // Wir zeichnen einen Bogen in Richtung des Monsters
        const angle = Math.atan2(this.currentTargetPos.y - this.y, this.currentTargetPos.x - this.x);
        ctx.arc(this.x, this.y, 35, angle - 0.5, angle + 0.5);
        ctx.stroke();
      } else {
        // FERNKAMPF: Ein Magiestrahl/Projektil vom Magier zum Ziel
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.currentTargetPos.x, this.currentTargetPos.y);
        ctx.setLineDash([5, 5]); // Gestrichelte Linie für Magie-Effekt
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}