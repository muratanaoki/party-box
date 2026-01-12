import { NestFactory } from '@nestjs/core';
import { AppModule } from './infrastructure/module/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`Party Box Backend running on port ${port}`);
}

bootstrap();
