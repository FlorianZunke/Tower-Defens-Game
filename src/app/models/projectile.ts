import { Monster } from './monster';

export class Projectile {
    x: number;
    y: number;
    target: Monster;
    damage: number;
    speed: number = 400; // Pixel pro Sekunde
    isActive: boolean = true;

    private image: HTMLImageElement;

    constructor(x: number, y: number, target: Monster, damage: number) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;

        this.image = new Image();
        this.image.src = 'assets/characters/Arrow.png'; // Dein Bild
    }

    update(dt: number) {
        if (!this.isActive) return;

        if (!this.target.isActive) {
            this.isActive = false;
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 1. Treffer-Check zuerst
        if (distance < 10) {
            this.target.hp -= this.damage;
            this.isActive = false;
            return;
        }

        // 2. Sicherheits-Check gegen NaN
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * dt;
            this.y += (dy / distance) * this.speed * dt;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;

        ctx.save();

        // 1. Zum Pfeil-Punkt verschieben
        ctx.translate(this.x, this.y);

        // 2. Rotation berechnen (Winkel zum Ziel)
        // Wir nehmen an, das Arrow.png zeigt nach RECHTS. Falls es nach oben zeigt, müssen wir + Math.PI/2 rechnen.
        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        ctx.rotate(angle);

        // 3. Pfeil zeichnen (zentriert)
        const width = 60;   // Länge des Pfeils
        const height = 20;  // Dicke des Pfeils
        ctx.drawImage(this.image, -width / 2, -height / 2, width, height);

        ctx.restore();
    }
}