import { Accelerometer } from 'expo-sensors';

export class MovementDetector {
  private subscription: any = null;
  private isMoving: boolean = false;
  private lastValues: number[] = [];
  private readonly WINDOW_SIZE = 15; // ~1.5 segundos de dados a 10Hz para maior estabilidade
  private readonly MOVING_THRESHOLD = 0.08; 

  public async start(onStatusChange: (moving: boolean) => void) {
    const isAvailable = await Accelerometer.isAvailableAsync();
    if (!isAvailable) {
      console.warn('[MovementDetector] Acelerômetro não disponível no dispositivo.');
      // Fallback: assume que está se movendo para não travar o GPS totalmente
      this.isMoving = true; 
      onStatusChange(true);
      return;
    }

    Accelerometer.setUpdateInterval(100); // 10Hz
    this.subscription = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      // Magnitude do vetor de aceleração (em Gs)
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      
      // Mantemos uma janela deslizante de magnitudes
      this.lastValues.push(magnitude);
      if (this.lastValues.length > this.WINDOW_SIZE) {
        this.lastValues.shift();
      }

      if (this.lastValues.length === this.WINDOW_SIZE) {
        // Calculamos o desvio padrão ou variância simples
        const avg = this.lastValues.reduce((a, b) => a + b, 0) / this.WINDOW_SIZE;
        const variance = this.lastValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / this.WINDOW_SIZE;
        
        const moving = variance > this.MOVING_THRESHOLD;
        if (moving !== this.isMoving) {
          this.isMoving = moving;
          onStatusChange(moving);
        }
      }
    });
  }

  public stop() {
    this.subscription?.remove();
    this.subscription = null;
    this.lastValues = [];
    this.isMoving = false;
  }

  public getStatus(): boolean {
    return this.isMoving;
  }
}
