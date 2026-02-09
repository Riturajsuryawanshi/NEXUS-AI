
import { WorkerService } from './workerService';
import { JobRecord } from '../types';

/**
 * Simulated Managed Task Queue
 * Provides asynchronous dispatch, retries, and simulates horizontal scaling.
 */
export class QueueService {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 2000; // Exponential backoff simulation

  /**
   * Pushes a job to the async queue.
   * In production, this would use SQS, Pub/Sub, or RabbitMQ.
   */
  static push(jobId: string, filePath: string, cacheKey: string, onUpdate: (job: Partial<JobRecord>) => void) {
    // Return immediately to satisfy non-blocking requirement
    this.executeInBackground(jobId, filePath, cacheKey, onUpdate, 0);
  }

  private static async executeInBackground(
    jobId: string, 
    filePath: string, 
    cacheKey: string, 
    onUpdate: (job: Partial<JobRecord>) => void,
    attempt: number
  ) {
    try {
      // Simulate queuing delay (scaling to zero/warming up)
      const warmingDelay = attempt === 0 ? 500 : 1000;
      await new Promise(r => setTimeout(r, warmingDelay));

      await WorkerService.processTask(jobId, filePath, cacheKey, onUpdate);
      
      console.log(`[Queue] Job ${jobId} completed successfully on attempt ${attempt + 1}`);
    } catch (err: any) {
      const nextAttempt = attempt + 1;
      
      if (nextAttempt < this.MAX_RETRIES) {
        console.warn(`[Queue] Retrying job ${jobId}. Attempt ${nextAttempt + 1}/${this.MAX_RETRIES}`);
        
        // Notify UI of retry status if desired, here we just keep status but increment counter
        onUpdate({ retryCount: nextAttempt });
        
        // Wait before retry (Exponential backoff simulation)
        await new Promise(r => setTimeout(r, this.RETRY_DELAY * nextAttempt));
        this.executeInBackground(jobId, filePath, cacheKey, onUpdate, nextAttempt);
      } else {
        console.error(`[Queue] Job ${jobId} failed after ${this.MAX_RETRIES} attempts.`);
        onUpdate({ 
          status: 'FAILED' as any, 
          error: `Pipeline failure after ${this.MAX_RETRIES} retries: ${err.message}` 
        });
      }
    }
  }
}
