import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, testConnection } from '../config/sequelize.config.js';
import apiRoutes from '../routes/index.route.js';
import { swaggerServe, swaggerSetup } from '../config/swagger.config.js';
import { errorHandler } from '../middlewares/error-handler.middlewares.js';

dotenv.config();

export class Server {
  private app: Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.connectDB();
    this.middlewares();
    this.routes();
    this.errorHandling();
  }

  private async connectDB(): Promise<void> {
    const isConnected = await testConnection();
    if (isConnected) {
      try {
        await sequelize.sync();
        console.log('📦 Modelos de Sequelize sincronizados con la base de datos.');
      } catch (err) {
        console.error('⚠️ Error al sincronizar modelos:', err);
      }
    }
  }

  private middlewares(): void {
    // CORS
    this.app.use(cors());

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Swagger Documentation
    this.app.use('/api/docs', swaggerServe, swaggerSetup);
  }

  private routes(): void {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ ok: true, timestamp: new Date().toISOString(), service: 'PokeDraft API' });
    });

    // API Gateway
    this.app.use('/api', apiRoutes);
  }

  private errorHandling(): void {
    this.app.use(errorHandler);
  }

  public getApp(): Application {
    return this.app;
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor PokeDraft corriendo en el puerto ${this.port}`);
      console.log(`📚 Documentación Swagger disponible en: http://localhost:${this.port}/api/docs`);
    });
  }
}
