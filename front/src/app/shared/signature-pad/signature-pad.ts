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
  private readonly exportedWidth = 520;
  private readonly exportedHeight = 180;
  private pixelRatio = 1;

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    this.signatureChange.emit(this.buildTrimmedSignatureDataUrl(canvas));
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef().nativeElement;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    this.pixelRatio = ratio;
    const rect = canvas.getBoundingClientRect();

    const previous = canvas.toDataURL('image/png');
    canvas.width = Math.max(360, Math.floor(rect.width * ratio));
    canvas.height = Math.floor(190 * ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (previous !== 'data:,') {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, rect.width, 190);
      };
      image.src = previous;
    }
  }

  private buildTrimmedSignatureDataUrl(canvas: HTMLCanvasElement): string | null {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = imageData[(y * width + x) * 4 + 3];
        if (alpha === 0) {
          continue;
        }

        if (x < minX) {
          minX = x;
        }
        if (y < minY) {
          minY = y;
        }
        if (x > maxX) {
          maxX = x;
        }
        if (y > maxY) {
          maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    const padding = Math.max(4, Math.round(8 * this.pixelRatio));
    const sourceX = Math.max(0, minX - padding);
    const sourceY = Math.max(0, minY - padding);
    const sourceWidth = Math.min(width - sourceX, maxX - minX + 1 + padding * 2);
    const sourceHeight = Math.min(height - sourceY, maxY - minY + 1 + padding * 2);

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = this.exportedWidth;
    outputCanvas.height = this.exportedHeight;

    const outputCtx = outputCanvas.getContext('2d');
    if (!outputCtx) {
      return null;
    }

    const horizontalPadding = 26;
    const verticalPadding = 18;
    const maxDrawWidth = this.exportedWidth - horizontalPadding * 2;
    const maxDrawHeight = this.exportedHeight - verticalPadding * 2;
    const scale = Math.min(maxDrawWidth / sourceWidth, maxDrawHeight / sourceHeight);

    const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
    const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
    const offsetX = Math.round((this.exportedWidth - drawWidth) / 2);
    const offsetY = Math.round((this.exportedHeight - drawHeight) / 2);

    outputCtx.drawImage(
      canvas,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
    );

    return outputCanvas.toDataURL('image/png');
  }

  private getPoint(event: PointerEvent, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
