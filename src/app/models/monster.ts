export class Monster {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    image: HTMLImageElement;
    isActive: boolean = true;
    waypointIndex: number = 0;

    // --- ANIMATION CONFIG ---
    // Tiny Swords Standard ist oft 192px. Falls der Ork komisch aussieht, probier hier 100 oder 64.
    private frameWidth = 64;
    private frameHeight = 64;

    private frameX = 0;     // Aktuelles Bild in der Reihe
    private frameY = 1;     // Reihe 2 (Index 1) -> Lauf-Animation
    private maxFrames = 8;  // Wie viele Bilder hat die Reihe?

    private fps = 10;       // Geschwindigkeit der Animation
    private frameTimer = 0;
    private frameInterval = 1000 / this.fps;

    constructor(startX: number, startY: number, stats: { hp: number, speed: number, imgUrl: string }) {
        this.x = startX;
        this.y = startY;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.speed = stats.speed;

        this.image = new Image();
        this.image.src = stats.imgUrl;
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

        // Optional: Falls du immer noch NaN Probleme hast, schalte dieses Log kurz ein:
        /*
        if (isNaN(this.x)) {
           console.error("NaN erkannt! target:", target, "distance:", distance, "dt:", dt);
        }
        */
    }

    draw(ctx: CanvasRenderingContext2D) {
        // DEBUG-LOG: Wird das hier überhaupt aufgerufen?
        // console.log("Monster Draw aufgerufen:", this.x, this.y, this.isActive);

        if (!this.isActive) return;

        ctx.save();

        // 1. DER PINK-PUNKT TEST (Nochmal ganz sicher)
        ctx.fillStyle = '#ff00ff'; // Knalliges Magenta
        ctx.beginPath();
        // Wir zeichnen einen RIESIGEN Kreis, damit wir ihn nicht übersehen können
        ctx.arc(this.x, this.y, 50, 0, Math.PI * 2);
        ctx.fill();

        // Rahmen drumherum
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.stroke();

        // 2. BILD ZEICHNEN (Nur wenn sicher)
        if (this.image.complete && this.image.naturalWidth > 0) {

            // Sicherstellen, dass wir im Bild bleiben
            const safeFrameWidth = Math.min(this.frameWidth, this.image.naturalWidth);
            const safeFrameHeight = Math.min(this.frameHeight, this.image.naturalHeight);

            ctx.drawImage(
                this.image,
                0, 0, safeFrameWidth, safeFrameHeight, // Nimm einfach das Eck oben links
                this.x - 25, this.y - 25, 50, 50       // Ziel
            );
        }

        ctx.restore();

        // Lebensbalken
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 20, this.y - 40, 40, 4);
        ctx.fillStyle = '#00ff00'; // Hellgrün sieht man besser
        ctx.fillRect(this.x - 20, this.y - 40, (Math.max(0, this.hp) / this.maxHp) * 40, 4);
    }
}