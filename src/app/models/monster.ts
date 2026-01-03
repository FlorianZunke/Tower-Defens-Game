export class Monster {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    image: HTMLImageElement;
    isActive: boolean = true;
    waypointIndex: number = 0;

    // SPRITE / ANIMATION CONFIG
    private spriteSheet: HTMLImageElement;

    // --- ANIMATION CONFIG ---
    // Tiny Swords Standard ist oft 192px. Falls der Ork komisch aussieht, probier hier 100 oder 64.
    private frameWidth = 100;
    private frameHeight = 100;

    private frameX = 0;     // Aktuelles Bild in der Reihe
    private frameY = 1;     // Reihe 2 (Index 1) -> Lauf-Animation
    private maxFrames = 8;  // Wie viele Bilder hat die Reihe?

    private fps = 10;       // Geschwindigkeit der Animation
    private frameTimer = 0;
    private frameInterval = 1000 / this.fps;
    private isFacingLeft: boolean = false;


    constructor(startX: number, startY: number, stats: { hp: number, speed: number, imgUrl: string }) {
        this.x = startX;
        this.y = startY;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;

        this.image = new Image();
        this.image.src = stats.imgUrl;

        // Bild laden
        this.spriteSheet = new Image();
        this.spriteSheet.src = 'assets/characters/Soldier.png'; // Stelle sicher, dass das Bild dort liegt!
    }

    update(dt: number, waypoints: any[]) {
        // 1. Abbruch-Bedingungen: Nichts tun, wenn inaktiv oder tot
        if (!this.isActive) return;

        if (this.hp <= 0) {
            this.isActive = false;
            return;
        }

        // 2. Animation: Frame berechnen
        this.frameTimer += dt * 1000;
        if (this.frameTimer > this.frameInterval) {
            this.frameX = (this.frameX + 1) % this.maxFrames;
            this.frameTimer = 0;
        }

        // 3. Bewegung: Ziel finden
        const target = waypoints[this.waypointIndex];
        if (!target) return; // Sicherheitscheck falls Waypoint-Array leer

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 4. Waypoint-Logik: Ziel fast erreicht?
        if (distance < 5) {
            this.waypointIndex++;
            if (this.waypointIndex >= waypoints.length) {
                this.isActive = false; // Ziel erreicht (Ende des Weges)
                return;
            }
        }

        // 5. Positions-Update: Nur bewegen, wenn Distanz > 0 (Verhindert NaN-Fehler)
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * dt;
            this.y += (dy / distance) * this.speed * dt;
        }

        if (dx < 0) {
            this.isFacingLeft = true;
        } else if (dx > 0) {
            this.isFacingLeft = false;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.isActive) return;

        // Nur zeichnen, wenn das Bild wirklich geladen ist
        if (!this.image.complete || this.image.naturalWidth === 0) {
            this.drawFallback(ctx);
            return;
        }

        ctx.save();

        // WICHTIG: Position runden, um Sub-Pixel-Flackern zu vermeiden
        ctx.translate(Math.floor(this.x), Math.floor(this.y));

        if (this.isFacingLeft) {
            ctx.scale(-1, 1);
        }

        // --- SPRITE BERECHNUNG ---
        // Wir runden sx und sy ab, damit wir immer exakte Pixel treffen
        const sx = Math.floor(this.frameX * this.frameWidth);
        const sy = Math.floor(this.frameY * this.frameHeight);

        // Prüfen, ob wir innerhalb des Bildes sind
        if (sx + this.frameWidth <= this.image.naturalWidth &&
            sy + this.frameHeight <= this.image.naturalHeight) {

            const drawSize = 64; // Wie groß soll der Ork im Spiel sein?
            const offset = drawSize / 2;

            ctx.drawImage(
                this.image,
                sx, sy, this.frameWidth, this.frameHeight,
                -offset, -offset, drawSize, drawSize
            );
        } else {
            // Falls die Frame-Größe falsch ist, zeichnen wir zumindest das ganze Bild
            ctx.drawImage(this.image, -20, -20, 40, 40);
        }

        ctx.restore();
        this.drawHealthBar(ctx);
    }

    private drawFallback(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D) {
        const barWidth = 40;
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 20, this.y - 45, barWidth, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 20, this.y - 45, barWidth * (this.hp / this.maxHp), 5);
    }
}