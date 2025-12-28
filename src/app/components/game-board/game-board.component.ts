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
        <button (click)="gameEngine.spawnTestMonster()" style="margin-left: 10px;">
          E-Rank Gate öffnen (Spawn)
        </button>
      </div>
      <canvas #gameCanvas width="800" height="600"></canvas>
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
      this.gameEngine.render(ctx);
    }

    requestAnimationFrame(this.gameLoop);
  }
}