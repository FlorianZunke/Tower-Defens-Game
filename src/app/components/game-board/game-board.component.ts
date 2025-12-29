import { Component, OnInit, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GameLogicService } from '../../engine/game-logic.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit, AfterViewInit {
  // Holt die Referenz auf das HTML-Element
  @ViewChild('gameCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  public gameEngine = inject(GameLogicService);
  selectedType: 'MELEE' | 'RANGED' = 'MELEE';
  hoveredSlot: { x: number, y: number, occupied: boolean } | null = null;
  protected location = location;

  public towerSlots = [
    { x: 150, y: 150, occupied: false },
    { x: 400, y: 300, occupied: false }
  ];


  ngOnInit() {
    // Logik-Initialisierung
  }

  ngAfterViewInit() {
    this.gameEngine.startGameLoop();
    this.gameLoop();
  }

  gameLoop = () => {
    // Sicherstellen, dass das Canvas existiert
    if (!this.canvas) return;

    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx) {
      this.gameEngine.render(ctx, this.towerSlots, this.hoveredSlot, this.selectedType);
    }

    requestAnimationFrame(this.gameLoop);
  }

  handleCanvasClick(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Kosten festlegen (Solo Leveling Style: Magier sind seltener/teurer)
    const costs = {
      'MELEE': 50,
      'RANGED': 100
    };

    const currentCost = costs[this.selectedType];

    this.towerSlots.forEach(slot => {
      const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);

      // Prüfen: Klick im Radius? Slot frei? Genug Mana für den gewählten Typ?
      if (dist < 25 && !slot.occupied && this.gameEngine.mana() >= currentCost) {
        slot.occupied = true;

        // Mana abziehen
        this.gameEngine.mana.update(m => m - currentCost);

        // Hunter hinzufügen (Wir nutzen deinen gewählten Typ)
        this.gameEngine.addCharacter(slot.x, slot.y, this.selectedType);

        console.log(`ARISE! ${this.selectedType} Schatten beschworen.`);
      } else if (dist < 25 && !slot.occupied && this.gameEngine.mana() < currentCost) {
        console.log("Nicht genug Mana für diesen Schatten!");
      }
    });
  }

  // Diese Methode wird bei jeder Mausbewegung auf dem Canvas aufgerufen
  handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Finde heraus, ob die Maus über einem Slot schwebt
    const foundSlot = this.towerSlots.find(slot => {
      const dist = Math.sqrt((x - slot.x) ** 2 + (y - slot.y) ** 2);
      return dist < 25; // 25 ist der Radius deiner Slots
    });

    this.hoveredSlot = foundSlot || null;
  }
}