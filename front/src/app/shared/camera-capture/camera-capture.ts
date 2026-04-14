import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-camera-capture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'camera-widget',
  },
  template: `
    @if (!cameraSupported()) {
      <p class="field-error">
        Este navegador no soporta acceso a camara. Puedes volver al modo firma.
      </p>
    } @else {
      <div class="camera-toolbar">
        <button type="button" class="ghost-button" [disabled]="disabled()" (click)="startCamera()">
          Activar camara
        </button>
        <button type="button" class="ghost-button" [disabled]="disabled() || !cameraActive()" (click)="capturePhoto()">
          Tomar foto
        </button>
        <button type="button" class="ghost-button" [disabled]="disabled() || !capturedPhoto()" (click)="clearPhoto()">
          Limpiar foto
        </button>
      </div>

      @if (cameraError()) {
        <small class="field-error">{{ cameraError() }}</small>
      }

      <video
        #cameraVideo
        class="camera-video"
        [class.camera-video-hidden]="!cameraActive()"
        playsinline
        autoplay
        muted
      ></video>

      @if (capturedPhoto()) {
        <img class="camera-preview" [src]="capturedPhoto()!" alt="Foto de evidencia de entrega" />
      } @else {
        <p class="camera-hint">Activa la camara y toma una foto del empleado recibiendo los implementos.</p>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.65rem;
    }

    .camera-toolbar {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .camera-video {
      width: 100%;
      max-height: 280px;
      border-radius: 14px;
      border: 1px solid #c7d0d7;
      background: #0f1720;
      object-fit: cover;
    }

    .camera-video-hidden {
      display: none;
    }

    .camera-preview {
      width: 100%;
      max-height: 280px;
      border-radius: 14px;
      border: 1px solid #b7c2cc;
      object-fit: cover;
    }

    .camera-hint {
      margin: 0;
      font-size: 0.85rem;
      color: #5f6a75;
    }
  `,
})
export class CameraCapture implements OnDestroy {
  private readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo');
  private readonly activeStream = signal<MediaStream | null>(null);

  disabled = input(false);
  photoChange = output<string | null>();

  protected readonly capturedPhoto = signal<string | null>(null);
  protected readonly cameraError = signal<string | null>(null);
  protected readonly cameraSupported = computed(() =>
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  );
  protected readonly cameraActive = computed(() => this.activeStream() !== null);

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (!this.cameraSupported() || this.disabled()) {
      return;
    }

    this.cameraError.set(null);
    this.stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.attachStream(stream);
    } catch {
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        this.attachStream(fallbackStream);
      } catch {
        this.cameraError.set('No fue posible acceder a la camara. Revisa permisos del navegador o del dispositivo.');
      }
    }
  }

  capturePhoto(): void {
    const stream = this.activeStream();
    const videoElement = this.videoRef()?.nativeElement;

    if (!stream || !videoElement || videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) {
      this.cameraError.set('La camara aun no esta lista. Intenta nuevamente en unos segundos.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      this.cameraError.set('No se pudo capturar la foto en este navegador.');
      return;
    }

    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    this.capturedPhoto.set(dataUrl);
    this.photoChange.emit(dataUrl);
  }

  clearPhoto(): void {
    this.capturedPhoto.set(null);
    this.photoChange.emit(null);
  }

  private attachStream(stream: MediaStream): void {
    const videoElement = this.videoRef()?.nativeElement;
    if (!videoElement) {
      stream.getTracks().forEach((track) => track.stop());
      this.cameraError.set('No se pudo inicializar la vista previa de la camara.');
      return;
    }

    videoElement.srcObject = stream;
    this.activeStream.set(stream);
  }

  private stopCamera(): void {
    const stream = this.activeStream();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const videoElement = this.videoRef()?.nativeElement;
    if (videoElement) {
      videoElement.srcObject = null;
    }

    this.activeStream.set(null);
  }
}