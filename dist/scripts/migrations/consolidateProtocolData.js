"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_1 = require("../../lib/prisma");
var client_1 = require("@prisma/client");
function createConsultationTable() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.$executeRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    CREATE TABLE IF NOT EXISTS protocol_consultations (\n      id TEXT PRIMARY KEY,\n      prescription_id TEXT UNIQUE REFERENCES protocol_prescriptions(id) ON DELETE CASCADE,\n      consultation_date TIMESTAMPTZ,\n      pre_consultation_template_id TEXT,\n      pre_consultation_status TEXT,\n      onboarding_link TEXT UNIQUE,\n      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n  "], ["\n    CREATE TABLE IF NOT EXISTS protocol_consultations (\n      id TEXT PRIMARY KEY,\n      prescription_id TEXT UNIQUE REFERENCES protocol_prescriptions(id) ON DELETE CASCADE,\n      consultation_date TIMESTAMPTZ,\n      pre_consultation_template_id TEXT,\n      pre_consultation_status TEXT,\n      onboarding_link TEXT UNIQUE,\n      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,\n      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP\n    );\n  "])))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function migrateUserProtocolsToPrescriptions() {
    return __awaiter(this, void 0, void 0, function () {
        var userProtocols, _i, userProtocols_1, userProtocol, existingPrescription, prescription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.userProtocol.findMany({
                        where: {
                            isActive: true
                        },
                        include: {
                            protocol: true
                        }
                    })];
                case 1:
                    userProtocols = _a.sent();
                    console.log("Encontrados ".concat(userProtocols.length, " protocolos de usu\u00E1rio para migrar"));
                    _i = 0, userProtocols_1 = userProtocols;
                    _a.label = 2;
                case 2:
                    if (!(_i < userProtocols_1.length)) return [3 /*break*/, 8];
                    userProtocol = userProtocols_1[_i];
                    return [4 /*yield*/, prisma_1.prisma.protocolPrescription.findFirst({
                            where: {
                                userId: userProtocol.userId,
                                protocolId: userProtocol.protocolId
                            }
                        })];
                case 3:
                    existingPrescription = _a.sent();
                    if (existingPrescription) {
                        console.log("Prescri\u00E7\u00E3o j\u00E1 existe para protocolo ".concat(userProtocol.id));
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, prisma_1.prisma.protocolPrescription.create({
                            data: {
                                protocolId: userProtocol.protocolId,
                                userId: userProtocol.userId,
                                prescribedBy: userProtocol.protocol.doctorId,
                                status: mapStatus(userProtocol.status),
                                currentDay: userProtocol.currentDay,
                                prescribedAt: userProtocol.createdAt,
                                plannedStartDate: userProtocol.startDate,
                                actualStartDate: userProtocol.status === 'ACTIVE' ? userProtocol.startDate : null,
                                plannedEndDate: userProtocol.endDate || new Date(userProtocol.startDate.getTime() + (userProtocol.protocol.duration || 30) * 24 * 60 * 60 * 1000)
                            }
                        })];
                case 4:
                    prescription = _a.sent();
                    if (!(userProtocol.consultationDate || userProtocol.preConsultationTemplateId || userProtocol.onboardingLink)) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma_1.prisma.$executeRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n        INSERT INTO protocol_consultations (\n          id,\n          prescription_id,\n          consultation_date,\n          pre_consultation_template_id,\n          pre_consultation_status,\n          onboarding_link\n        ) VALUES (\n          gen_random_uuid(),\n          ", ",\n          ", ",\n          ", ",\n          ", ",\n          ", "\n        );\n      "], ["\n        INSERT INTO protocol_consultations (\n          id,\n          prescription_id,\n          consultation_date,\n          pre_consultation_template_id,\n          pre_consultation_status,\n          onboarding_link\n        ) VALUES (\n          gen_random_uuid(),\n          ", ",\n          ", ",\n          ", ",\n          ", ",\n          ", "\n        );\n      "])), prescription.id, userProtocol.consultationDate, userProtocol.preConsultationTemplateId, userProtocol.preConsultationStatus, userProtocol.onboardingLink)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    console.log("Migrado protocolo ".concat(userProtocol.id, " para prescri\u00E7\u00E3o ").concat(prescription.id));
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function migrateProtocolProgress() {
    return __awaiter(this, void 0, void 0, function () {
        var oldProgress, _i, oldProgress_1, progress, prescription, existingProgress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.protocolDayProgress.findMany({
                        include: {
                            protocols: true
                        }
                    })];
                case 1:
                    oldProgress = _a.sent();
                    console.log("Encontrados ".concat(oldProgress.length, " registros de progresso para migrar"));
                    _i = 0, oldProgress_1 = oldProgress;
                    _a.label = 2;
                case 2:
                    if (!(_i < oldProgress_1.length)) return [3 /*break*/, 7];
                    progress = oldProgress_1[_i];
                    return [4 /*yield*/, prisma_1.prisma.protocolPrescription.findFirst({
                            where: {
                                userId: progress.userId,
                                protocolId: progress.protocolId
                            }
                        })];
                case 3:
                    prescription = _a.sent();
                    if (!prescription) {
                        console.log("Prescri\u00E7\u00E3o n\u00E3o encontrada para progresso ".concat(progress.id));
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, prisma_1.prisma.protocolDayProgressV2.findFirst({
                            where: {
                                prescriptionId: prescription.id,
                                dayNumber: progress.dayNumber,
                                protocolTaskId: progress.protocolTaskId
                            }
                        })];
                case 4:
                    existingProgress = _a.sent();
                    if (existingProgress) {
                        console.log("Progresso V2 j\u00E1 existe para ".concat(progress.id));
                        return [3 /*break*/, 6];
                    }
                    // Criar novo progresso
                    return [4 /*yield*/, prisma_1.prisma.protocolDayProgressV2.create({
                            data: {
                                prescriptionId: prescription.id,
                                dayNumber: progress.dayNumber,
                                scheduledDate: progress.date || new Date(prescription.plannedStartDate.getTime() + (progress.dayNumber - 1) * 24 * 60 * 60 * 1000),
                                completedAt: progress.completedAt,
                                status: progress.completed || progress.isCompleted ? client_1.DayStatus.COMPLETED : client_1.DayStatus.PENDING,
                                notes: progress.notes,
                                protocolTaskId: progress.protocolTaskId
                            }
                        })];
                case 5:
                    // Criar novo progresso
                    _a.sent();
                    console.log("Migrado progresso ".concat(progress.id));
                    _a.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function mapStatus(oldStatus) {
    switch (oldStatus.toUpperCase()) {
        case 'ACTIVE':
            return client_1.PrescriptionStatus.ACTIVE;
        case 'COMPLETED':
            return client_1.PrescriptionStatus.COMPLETED;
        case 'ABANDONED':
            return client_1.PrescriptionStatus.ABANDONED;
        case 'PAUSED':
            return client_1.PrescriptionStatus.PAUSED;
        default:
            return client_1.PrescriptionStatus.PRESCRIBED;
    }
}
function updateAdherenceRates() {
    return __awaiter(this, void 0, void 0, function () {
        var prescriptions, _i, prescriptions_1, prescription, totalDays, completedDays, missedDays, adherenceRate;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.protocolPrescription.findMany({
                        include: {
                            progressV2: true
                        }
                    })];
                case 1:
                    prescriptions = _b.sent();
                    _i = 0, prescriptions_1 = prescriptions;
                    _b.label = 2;
                case 2:
                    if (!(_i < prescriptions_1.length)) return [3 /*break*/, 5];
                    prescription = prescriptions_1[_i];
                    totalDays = prescription.progressV2.length;
                    completedDays = prescription.progressV2.filter(function (p) { return p.status === client_1.DayStatus.COMPLETED; }).length;
                    missedDays = prescription.progressV2.filter(function (p) { return p.status === client_1.DayStatus.MISSED; }).length;
                    adherenceRate = totalDays > 0
                        ? (completedDays / (completedDays + missedDays)) * 100
                        : 0;
                    return [4 /*yield*/, prisma_1.prisma.protocolPrescription.update({
                            where: { id: prescription.id },
                            data: {
                                adherenceRate: adherenceRate,
                                lastProgressDate: ((_a = prescription.progressV2
                                    .filter(function (p) { return p.completedAt; })
                                    .sort(function (a, b) { return b.completedAt.getTime() - a.completedAt.getTime(); })[0]) === null || _a === void 0 ? void 0 : _a.completedAt) || null
                            }
                        })];
                case 3:
                    _b.sent();
                    console.log("Atualizada taxa de ades\u00E3o para prescri\u00E7\u00E3o ".concat(prescription.id, ": ").concat(adherenceRate, "%"));
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 8]);
                    console.log('Iniciando migração de dados...');
                    console.log('Criando tabela de consultas...');
                    return [4 /*yield*/, createConsultationTable()];
                case 1:
                    _a.sent();
                    console.log('Migrando protocolos de usuário para prescrições...');
                    return [4 /*yield*/, migrateUserProtocolsToPrescriptions()];
                case 2:
                    _a.sent();
                    console.log('Migrando registros de progresso...');
                    return [4 /*yield*/, migrateProtocolProgress()];
                case 3:
                    _a.sent();
                    console.log('Atualizando taxas de adesão...');
                    return [4 /*yield*/, updateAdherenceRates()];
                case 4:
                    _a.sent();
                    console.log('Migração concluída com sucesso!');
                    return [3 /*break*/, 8];
                case 5:
                    error_1 = _a.sent();
                    console.error('Erro durante a migração:', error_1);
                    throw error_1;
                case 6: return [4 /*yield*/, prisma_1.prisma.$disconnect()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Executar migração
main()
    .catch(console.error);
var templateObject_1, templateObject_2;
