"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Optional, falls du /api/... haben willst
    app.setGlobalPrefix("api");
    // CORS, falls Frontend mal separat laufen sollte
    app.enableCors({
        origin: true,
        credentials: true,
    });
    await app.listen(8000);
}
bootstrap();
//# sourceMappingURL=main.js.map