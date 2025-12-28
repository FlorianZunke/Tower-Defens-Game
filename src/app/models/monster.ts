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
        this.image.src = '/images/monsters/Hallokin/idle.png';
    }

    // Jedes Monster weiß selbst, wie es sich bewegt
    update(dt: number, waypoints: { x: number, y: number }[]) {
        const target = waypoints[this.waypointIndex];

        // Richtung berechnen
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            this.waypointIndex++; // Nächster Punkt, wenn nah genug dran
            if (this.waypointIndex >= waypoints.length) {
                this.isActive = false; // Monster hat das Ende erreicht (Schaden am Spieler!)
                return;
            }
        }

        // Bewegen
        this.x += (dx / distance) * this.speed * dt;
        this.y += (dy / distance) * this.speed * dt;
    }

    // Jedes Monster weiß selbst, wie es gezeichnet wird
    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;

        ctx.save(); // Speichert den aktuellen Zustand des Canvas (Farben, Filter etc.)

        ctx.shadowBlur = 20;            // Wie stark soll es leuchten?
        ctx.shadowColor = '#4b0082';  // In welcher Farbe soll es leuchten?

        ctx.drawImage(this.image, this.x, this.y, 50, 50); // Zeichne das Bild mit dem Leuchten
        ctx.restore(); // Setzt den Zustand zurück (schaltet das Leuchten für das nächste Objekt aus)

        // Kleiner Lebensbalken über dem Monster
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, 50, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y - 10, (this.hp / this.maxHp) * 50, 5);
    }
}