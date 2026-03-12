import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Export OpenAPI/Swagger JSON schema
 * Usage: ts-node scripts/export-swagger.ts
 */
async function exportSwagger() {
  console.log('🚀 Exporting Swagger/OpenAPI schema...\n');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
      logger: false, // Disable logging for clean output
    });

    // Build Swagger configuration (same as main.ts)
    const config = new DocumentBuilder()
      .setTitle('Dropbox App API')
      .setDescription('Complete API documentation for Dropbox-like application')
      .setVersion('1.0')
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

    // Generate OpenAPI document
    const document = SwaggerModule.createDocument(app, config);

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Export to multiple formats
    const jsonPath = path.join(outputDir, 'swagger.json');
    const yamlPath = path.join(outputDir, 'swagger.yaml');

    // Export JSON
    fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
    console.log(`✅ OpenAPI JSON exported to: ${jsonPath}`);

    // Export YAML (optional)
    const yaml = jsonToYaml(document);
    fs.writeFileSync(yamlPath, yaml);
    console.log(`✅ OpenAPI YAML exported to: ${yamlPath}`);

    // Also copy to root for easy access
    const rootJsonPath = path.join(process.cwd(), 'swagger.json');
    fs.writeFileSync(rootJsonPath, JSON.stringify(document, null, 2));
    console.log(`✅ Copy created at: ${rootJsonPath}`);

    console.log('\n📚 Usage:');
    console.log('  - Send to frontend team: swagger.json');
    console.log('  - Generate types: openapi-generator-cli generate -i swagger.json');
    console.log('  - View online: https://editor.swagger.io/');

    await app.close();
  } catch (error) {
    console.error('❌ Failed to export Swagger:', error);
    process.exit(1);
  }
}

/**
 * Simple JSON to YAML converter
 */
function jsonToYaml(obj: any, indent = 0): string {
  let yaml = '';
  const spaces = '  '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      yaml += `${spaces}${key}: null\n`;
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach((item) => {
        if (typeof item === 'object') {
          yaml += `${spaces}- \n${jsonToYaml(item, indent + 1)}`;
        } else {
          yaml += `${spaces}- ${item}\n`;
        }
      });
    } else if (typeof value === 'object') {
      yaml += `${spaces}${key}:\n${jsonToYaml(value, indent + 1)}`;
    } else if (typeof value === 'string') {
      yaml += `${spaces}${key}: "${value}"\n`;
    } else {
      yaml += `${spaces}${key}: ${value}\n`;
    }
  }

  return yaml;
}

// Run export
exportSwagger();
