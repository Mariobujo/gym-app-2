// packages/backend/src/services/audit.service.ts

import AuditModel, { AuditEventType, IAudit } from '../models/audit.model';
import { PipelineStage } from 'mongoose';

/**
 * Interfaz para registrar eventos de auditoría
 */
interface AuditEventData {
  userId: string;
  eventType: AuditEventType;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failure';
  requestId?: string;
}

/**
 * Opciones para búsqueda de eventos de auditoría
 */
interface AuditSearchOptions {
  page?: number;
  limit?: number;
  sort?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Servicio para gestionar eventos de auditoría
 */
export class AuditService {
  /**
   * Registra un evento de auditoría
   */
  async logEvent(eventData: AuditEventData): Promise<IAudit> {
    try {
      // Asegurarse que userId sea string incluso si recibimos un ObjectId
      const userId = eventData.userId?.toString() || 'anonymous';
      
      const auditLog = await AuditModel.create({
        timestamp: new Date(),
        userId,
        eventType: eventData.eventType,
        resourceType: eventData.resourceType,
        resourceId: eventData.resourceId?.toString(), // Asegurar que resourceId sea string
        details: eventData.details,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        status: eventData.status || 'success',
        requestId: eventData.requestId
      });
      
      return auditLog;
    } catch (error) {
      // Si falla el registro, logueamos pero no interrumpimos el flujo
      console.error('Error registrando evento de auditoría:', error);
      console.error('Evento:', JSON.stringify(eventData));
      
      // Crear un objeto dummy para no romper el flujo
      return {
        _id: 'error',
        timestamp: new Date(),
        userId: eventData.userId || 'anonymous',
        eventType: eventData.eventType,
        status: 'failure'
      } as any;
    }
  }
  
  /**
   * Busca eventos de auditoría con filtros y paginación
   */
  async findEvents(
    filters: Partial<AuditEventData>,
    options: AuditSearchOptions = {}
  ): Promise<{ events: IAudit[]; total: number; page: number; pages: number }> {
    const { 
      page = 1, 
      limit = 50, 
      sort = '-timestamp',
      startDate,
      endDate
    } = options;
    
    const queryFilters: any = { ...filters };
    
    // Agregar filtro de fecha si se proporciona
    if (startDate || endDate) {
      queryFilters.timestamp = {};
      
      if (startDate) {
        queryFilters.timestamp.$gte = startDate;
      }
      
      if (endDate) {
        queryFilters.timestamp.$lte = endDate;
      }
    }
    
    // Calcular skip para paginación
    const skip = (page - 1) * limit;
    
    // Ejecutar consulta con filtros y paginación
    const [events, total] = await Promise.all([
      AuditModel.find(queryFilters)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AuditModel.countDocuments(queryFilters)
    ]);
    
    // Calcular páginas totales
    const pages = Math.ceil(total / limit);
    
    return {
      events,
      total,
      page,
      pages
    };
  }
  
  /**
   * Obtiene un resumen de actividad para un usuario
   */
  async getUserActivitySummary(userId: string): Promise<any> {
    const pipeline: PipelineStage[] = [
      // Filtrar por usuario
      { $match: { userId: userId.toString() } },
      
      // Agrupar por tipo de evento y calcular conteo
      { 
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastOccurrence: { $max: '$timestamp' }
        }
      },
      
      // Ordenar por conteo descendente
      { $sort: { count: -1 } }
    ];
    
    const results = await AuditModel.aggregate(pipeline);
    
    // Formatear resultados
    return results.map(item => ({
      eventType: item._id,
      count: item.count,
      lastOccurrence: item.lastOccurrence
    }));
  }
  
  /**
   * Obtiene eventos de login fallidos para detectar posibles ataques
   */
  async getFailedLogins(options: { 
    hours?: number; 
    minAttempts?: number;
    includeIps?: boolean;
  } = {}): Promise<any> {
    const { hours = 24, minAttempts = 3, includeIps = true } = options;
    
    // Calcular fecha de inicio
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);
    
    // Pipeline base
    const basePipeline: PipelineStage[] = [
      // Filtrar por tipo de evento y estado
      { 
        $match: { 
          eventType: AuditEventType.AUTHENTICATION_FAILED,
          status: 'failure',
          timestamp: { $gte: startDate }
        }
      }
    ];
    
    // Pipeline para agrupar por usuario
    const userPipeline: PipelineStage[] = [
      ...basePipeline,
      // Agrupar por usuario
      { 
        $group: {
          _id: '$userId',
          attempts: { $sum: 1 },
          lastAttempt: { $max: '$timestamp' }
        }
      },
      // Filtrar por número mínimo de intentos
      { $match: { attempts: { $gte: minAttempts } } },
      // Ordenar por intentos descendente
      { $sort: { attempts: -1 } }
    ];
    
    // Resultados agrupados por usuario
    const userResults = await AuditModel.aggregate(userPipeline);
    
    // Si no se solicitan IPs, retornar resultados por usuario
    if (!includeIps) {
      return {
        byUser: userResults.map(item => ({
          userId: item._id,
          attempts: item.attempts,
          lastAttempt: item.lastAttempt
        }))
      };
    }
    
    // Pipeline para agrupar por IP
    const ipPipeline: PipelineStage[] = [
      ...basePipeline,
      // Filtrar IPs no vacías
      { 
        $match: { 
          ipAddress: { 
            $exists: true, 
            $ne: null
          } 
        } 
      },
      // Agrupar por IP
      { 
        $group: {
          _id: '$ipAddress',
          attempts: { $sum: 1 },
          lastAttempt: { $max: '$timestamp' },
          users: { $addToSet: '$userId' }
        }
      },
      // Filtrar por número mínimo de intentos
      { $match: { attempts: { $gte: minAttempts } } },
      // Ordenar por intentos descendente
      { $sort: { attempts: -1 } }
    ];
    
    // Resultados agrupados por IP
    const ipResults = await AuditModel.aggregate(ipPipeline);
    
    return {
      byUser: userResults.map(item => ({
        userId: item._id,
        attempts: item.attempts,
        lastAttempt: item.lastAttempt
      })),
      byIp: ipResults.map(item => ({
        ipAddress: item._id,
        attempts: item.attempts,
        lastAttempt: item.lastAttempt,
        uniqueUsers: item.users.length,
        users: item.users
      }))
    };
  }
}

export { AuditEventType };
export default new AuditService();