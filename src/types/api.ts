export interface NestJsErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface CanEnterResponse {
  canEnter: boolean;
}
