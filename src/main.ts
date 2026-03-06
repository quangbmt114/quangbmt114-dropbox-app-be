import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure CORS before static assets
  app.enableCors({
    origin: '*', // Allow all origins for file viewing
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Add middleware to set proper headers for static files
  app.use('/uploads', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Set CORS headers for static files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // Set Content-Disposition to inline so browser displays instead of downloads
    res.setHeader('Content-Disposition', 'inline');
    
    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    
    next();
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Get logger service
  const logger = app.get(LoggerService);

  // Use custom logger
  app.useLogger(logger);

  // Global exception filter with logger
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  // Enable validation with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger configuration for production-ready API documentation
  const swaggerPath = process.env.SWAGGER_PATH || 'api';
  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Dropbox App API')
    .setDescription(
      process.env.SWAGGER_DESCRIPTION ||
        'Complete API documentation for Dropbox-like application with authentication, file management, and user operations.',
    )
    .setVersion(process.env.SWAGGER_VERSION || '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Files', 'File upload and management')
    .addTag('Health', 'Health check and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`, {
    context: 'Bootstrap',
  });
  logger.log(`📚 Swagger documentation: http://localhost:${port}/${swaggerPath}`, {
    context: 'Bootstrap',
  });
  logger.log(`📄 Swagger JSON: http://localhost:${port}/${swaggerPath}-json`, {
    context: 'Bootstrap',
  });
  logger.log(`✅ Health check: http://localhost:${port}/health`, {
    context: 'Bootstrap',
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
