import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GameLogicService } from '../../engine/game-logic.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-container">
      <div class="stats">
        Mana: {{ gameEngine.mana() | number:'1.0-0' }} | 
        Level: {{ gameEngine.level() }}
        <button (click)="gameEngine.startWave()" [disabled]="gameEngine.isWaveRunning()">
          Nächstes Gate öffnen (Welle starten)
        </button>
      </div>
      <canvas #gameCanvas (click)="handleCanvasClick($event)" width="800" height="600"></canvas>
    </div>
  `,
  styles: [`
    .game-container { color: #8a2be2; font-family: 'Courier New', monospace; padding: 20px; }
    canvas { background: #000; border: 3px solid #4b0082; display: block; margin-top: 10px; }
    .stats { font-size: 1.2rem; font-weight: bold; }
  `]
})
export class GameBoardComponent implements OnInit, AfterViewInit {
  // Holt die Referenz auf das HTML-Element
  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  public gameEngine = inject(GameLogicService);

  public towerSlots = [
    { x: 150, y: 150, occupied: false },
    { x: 400, y: 300, occupied: false }
  ];


  ngOnInit() {
    // Logik-Initialisierung
  }

  ngAfterViewInit() {
    // Erst hier ist das Canvas sicher verfügbar!
    this.gameEngine.startGameLoop();
    this.gameLoop();
  }

  gameLoop = () => {
    // Sicherstellen, dass das Canvas existiert
    if (!this.canvas) return;

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.gameEngine.render(ctx, this.towerSlots);
    }

    requestAnimationFrame(this.gameLoop);
  }

  handleCanvasClick(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.towerSlots.forEach(slot => {
      const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);

      // Wenn in den Kreis geklickt wurde und genug Mana da ist
      if (dist < 25 && !slot.occupied && this.gameEngine.mana() >= 50) {
        slot.occupied = true;
        this.gameEngine.mana.update(m => m - 50);
        this.gameEngine.addHunter(slot.x, slot.y);
        console.log("ARISE!");
      }
    });
  }

  placeHunter(slot: any) {
    if (this.gameEngine.mana() >= 50) { // Kosten für einen Schatten-Soldaten
      this.gameEngine.mana.update(m => m - 50);
      slot.occupied = true;
      console.log("Arise! Ein Schatten-Soldat wurde beschworen.");
      // Hier rufen wir später: this.gameEngine.addHunter(slot.x, slot.y);
    }
  }
}