/**
 * Filtro de Kalman simples para suavização de coordenadas GPS.
 * Baseado no modelo de medição de posição com incerteza.
 */
export class KalmanFilter {
  private variance: number; // Incerteza do processo
  private estimate: number; // Valor estimado
  private errorCovariance: number; // Covariância do erro
  private initialized: boolean = false;

  constructor(processVariance: number = 1e-6) {
    this.variance = processVariance;
    this.estimate = 0;
    this.errorCovariance = 1;
  }

  /**
   * Filtra uma nova medição.
   * @param measurement O valor bruto (lat ou lng)
   * @param measurementVariance A incerteza da medição (accuracy do GPS)
   */
  public filter(measurement: number, measurementVariance: number): number {
    if (!this.initialized) {
      this.estimate = measurement;
      this.errorCovariance = measurementVariance;
      this.initialized = true;
      return this.estimate;
    }

    // Predição
    // (Em um modelo simples de posição, a estimativa anterior é a predição)
    const priorEstimate = this.estimate;
    const priorErrorCovariance = this.errorCovariance + this.variance;

    // Ganho de Kalman
    const kalmanGain = priorErrorCovariance / (priorErrorCovariance + measurementVariance);

    // Atualização
    this.estimate = priorEstimate + kalmanGain * (measurement - priorEstimate);
    this.errorCovariance = (1 - kalmanGain) * priorErrorCovariance;

    return this.estimate;
  }

  public reset(): void {
    this.initialized = false;
  }
}

/**
 * Wrapper para gerenciar 2D (Lat/Lng)
 */
export class GeoKalmanFilter {
  private latFilter: KalmanFilter;
  private lngFilter: KalmanFilter;

  constructor() {
    // Process Variance ajustado para movimento humano (corrida)
    this.latFilter = new KalmanFilter(0.000001);
    this.lngFilter = new KalmanFilter(0.000001);
  }

  public process(lat: number, lng: number, accuracy: number): { latitude: number; longitude: number } {
    // Convertemos accuracy (metros) para uma variância proporcional em graus (~111km por grau)
    const variance = (accuracy * accuracy) / 1000000; 

    return {
      latitude: this.latFilter.filter(lat, variance),
      longitude: this.lngFilter.filter(lng, variance),
    };
  }

  public reset(): void {
    this.latFilter.reset();
    this.lngFilter.reset();
  }
}
