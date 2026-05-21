"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterArtisanDto = exports.RefreshDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterDto {
    full_name;
    email;
    password;
    role;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "full_name", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.Matches)(/^(?=.*[A-Z])(?=.*\d).+$/, {
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['artesano', 'comprador']),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class RefreshDto {
    refresh_token;
}
exports.RefreshDto = RefreshDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshDto.prototype, "refresh_token", void 0);
class RegisterArtisanDto extends RegisterDto {
    id_number;
    cultural_history;
    category_id;
    region_id;
    truthfulness_declaration;
}
exports.RegisterArtisanDto = RegisterArtisanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterArtisanDto.prototype, "id_number", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterArtisanDto.prototype, "cultural_history", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterArtisanDto.prototype, "category_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterArtisanDto.prototype, "region_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterArtisanDto.prototype, "truthfulness_declaration", void 0);
//# sourceMappingURL=auth.dto.js.map