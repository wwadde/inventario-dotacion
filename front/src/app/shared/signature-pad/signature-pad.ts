import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-signature-pad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'signature-widget',
  },
  template: `
    <div class="signature-toolbar">
      <p class="signature-hint">Firma en el recuadro usando mouse o dedo.</p>
      <button type="button" class="ghost-button" (click)="clear()">Limpiar firma</button>
    </div>
    <canvas
      #signatureCanvas
      class="signature-canvas"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointerleave)="onPointerUp($event)"
      aria-label="Lienzo para firma digital"
    ></canvas>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.6rem;
    }

    .signature-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .signature-hint {
      margin: 0;
      font-size: 0.84rem;
      color: #5f6a75;
    }

    .ghost-button {
      border: 1px solid #c7d0d7;
      border-radius: 999px;
      padding: 0.35rem 0.8rem;
      background: #ffffff;
      font: inherit;
      cursor: pointer;
    }

    .ghost-button:hover {
      background: #f5f7fa;
    }

    .signature-canvas {
      width: 100%;
      min-height: 190px;
      border-radius: 16px;
      border: 1px dashed #b3bcc5;
      background: #ffffff;
      touch-action: none;
      box-sizing: border-box;
    }
  `,
})
export class SignaturePad implements AfterViewInit {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('signatureCanvas');
  private readonly isDrawing = signal(false);

  signatureChange = output<string | null>();
  lineColor = input('#132030');

  ngAfterViewInit(): void {
    this.resizeCanvas();
    this.clear();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  clear(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.signatureChange.emit(null);
  }

  onPointerDown(event: PointerEvent): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    this.isDrawing.set(true);
    const point = this.getPoint(event, canvas);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    canvas.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDrawing()) {
      return;
    }

    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const point = this.getPoint(event, canvas);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = this.lineColor();
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.isDrawing()) {
      return;
    }

    const canvas = this.canvasRef().nativeElement;
    this.isDrawing.set(false);
    canvas.releasePointerCapture(event.pointerId);

    this.signatureChange.emit(canvas.toDataURL('image/png'));
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef().nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();

    const previous = canvas.toDataURL('image/png');
    canvas.width = Math.max(360, Math.floor(rect.width * ratio));
    canvas.height = Math.floor(190 * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (previous !== 'data:,') {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, rect.width, 190);
      };
      image.src = previous;
    }
  }

  private getPoint(event: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
