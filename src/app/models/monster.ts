export class Monster {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    image: HTMLImageElement;
    isActive: boolean = true;
    waypointIndex: number = 0;

    constructor(startX: number, startY: number, stats: { hp: number, speed: number, imgUrl: string }) {
        this.x = startX;
        this.y = startY;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;

        // Bild laden
        this.image = new Image();
        this.image.src = stats.imgUrl;
    }

    // Jedes Monster weiß selbst, wie es sich bewegt
    update(dt: number, waypoints: { x: number, y: number }[]) {
        const target = waypoints[this.waypointIndex];
        if (!target) return;

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Wenn wir fast da sind ODER distance 0 ist
        if (distance < 2) {
            this.waypointIndex++;
            if (this.waypointIndex >= waypoints.length) {
                this.isActive = false;
            }
            return;
        }

        // Bewegen (Nur wenn distance > 0)
        this.x += (dx / distance) * this.speed * dt;
        this.y += (dy / distance) * this.speed * dt;
    }

    // Jedes Monster weiß selbst, wie es gezeichnet wird
    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;

        ctx.save();

        // Wenn das Bild geladen ist UND eine Breite hat (nicht broken)
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#4b0082';
            ctx.drawImage(this.image, this.x = -25, this.y = -25, 50, 50);
            ctx.restore();
        } else {
            // FALLBACK: Ein grüner Kreis für Goblins
            ctx.fillStyle = '#2ecc71'; // Goblin-Grün
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
            // Ein kleiner Leuchteffekt auch für den Kreis
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#2ecc71';
            ctx.stroke();
        }

        ctx.restore();

        // Lebensbalken (bleibt wie er ist)
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 25, this.y - 35, 50, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 25, this.y - 35, (this.hp / this.maxHp) * 50, 5);
    }
}