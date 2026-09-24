import healthRepository from './health.repository.js';

export class HealthService {
  async checkHealth() {
    try {
      await healthRepository.pingDatabase();
      return {
        database: 'connected'
      };
    } catch (error) {
      return {
        database: 'disconnected',
        error: 'Database connection unavailable'
      };
    }
  }
}

export default new HealthService();
