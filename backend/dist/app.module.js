"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const sensor_module_1 = require("./sensor/sensor.module");
const village_module_1 = require("./village/village.module");
const mobile_module_1 = require("./mobile/mobile.module");
const app_controller_1 = require("./app.controller");
const location_module_1 = require("./location/location.module");
const admin_module_1 = require("./admin/admin.module");
const device_module_1 = require("./device/device.module");
const mqtt_module_1 = require("./mqtt/mqtt.module");
const app_api_module_1 = require("./app-api/app-api.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            sensor_module_1.SensorModule,
            village_module_1.VillageModule,
            mobile_module_1.MobileModule,
            location_module_1.LocationModule,
            admin_module_1.AdminModule,
            device_module_1.DeviceModule,
            mqtt_module_1.MqttModule,
            app_api_module_1.AppApiModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map