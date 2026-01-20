import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import authRoutes from './routes/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { testSupabaseConnection } from './config/supabase.js';

const app: Application = express();

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'gym-backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(config.port, async () => {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     GymFlow Backend API Server      ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on: http://localhost:${config.port}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 CORS enabled for: ${config.frontendUrl}`);
  console.log('');
  
  // Probar conexión a Supabase
  console.log('🔌 Testing Supabase connection...');
  await testSupabaseConnection();
  console.log('');
  
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${config.port}/health`);
  console.log(`  POST http://localhost:${config.port}/api/auth/login`);
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

export default app;
