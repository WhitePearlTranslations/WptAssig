import { realtimeService } from '../services/realtimeService';

/**
 * Migración para actualizar tipos de tareas antiguos a los nuevos estándares
 * Convierte:
 * - 'cleaning' -> 'cleanRedrawer' 
 * - 'typesetting' -> 'type'
 */
export const migrateAssignmentTypes = async () => {
  console.log('🔄 Iniciando migración de tipos de tareas...');
  
  try {
    // Obtener todas las asignaciones
    const allAssignments = await realtimeService.getAllAssignments();
    console.log(`📋 Encontradas ${allAssignments.length} asignaciones para revisar`);

    let migrationsNeeded = 0;
    let migrationsCompleted = 0;
    const migrationMap = {
      'cleaning': 'cleanRedrawer',
      'typesetting': 'type'
    };

    // Revisar cada asignación
    for (const assignment of allAssignments) {
      let needsUpdate = false;
      const updates = {};

      // Revisar campo 'type'
      if (assignment.type && migrationMap[assignment.type]) {
        updates.type = migrationMap[assignment.type];
        needsUpdate = true;
        console.log(`📝 Actualizando asignación ${assignment.id}: type '${assignment.type}' -> '${migrationMap[assignment.type]}'`);
      }

      // Revisar campo 'tasks' (array)
      if (assignment.tasks && Array.isArray(assignment.tasks)) {
        const updatedTasks = assignment.tasks.map(task => migrationMap[task] || task);
        
        // Verificar si hubo cambios
        if (JSON.stringify(updatedTasks) !== JSON.stringify(assignment.tasks)) {
          updates.tasks = updatedTasks;
          needsUpdate = true;
          console.log(`📝 Actualizando asignación ${assignment.id}: tasks [${assignment.tasks.join(', ')}] -> [${updatedTasks.join(', ')}]`);
        }
      }

      if (needsUpdate) {
        migrationsNeeded++;
        try {
          await realtimeService.updateAssignment(assignment.id, updates);
          migrationsCompleted++;
          console.log(`✅ Asignación ${assignment.id} actualizada correctamente`);
        } catch (error) {
          console.error(`❌ Error actualizando asignación ${assignment.id}:`, error);
        }
      }
    }

    console.log(`\n📊 Migración completada:`);
    console.log(`   • Asignaciones revisadas: ${allAssignments.length}`);
    console.log(`   • Migraciones necesarias: ${migrationsNeeded}`);
    console.log(`   • Migraciones exitosas: ${migrationsCompleted}`);
    console.log(`   • Errores: ${migrationsNeeded - migrationsCompleted}`);

    if (migrationsCompleted > 0) {
      console.log('🎉 Migración completada exitosamente!');
      return {
        success: true,
        total: allAssignments.length,
        migrated: migrationsCompleted,
        errors: migrationsNeeded - migrationsCompleted
      };
    } else if (migrationsNeeded === 0) {
      console.log('ℹ️ No se encontraron asignaciones que requieran migración');
      return {
        success: true,
        total: allAssignments.length,
        migrated: 0,
        errors: 0,
        message: 'No se requiere migración'
      };
    } else {
      console.log('⚠️ Hubo errores durante la migración');
      return {
        success: false,
        total: allAssignments.length,
        migrated: migrationsCompleted,
        errors: migrationsNeeded - migrationsCompleted
      };
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar si hay asignaciones que necesitan migración (sin realizar cambios)
 */
export const checkMigrationNeeded = async () => {
  try {
    const allAssignments = await realtimeService.getAllAssignments();
    const migrationMap = {
      'cleaning': 'cleanRedrawer',
      'typesetting': 'type'
    };

    let needsMigration = 0;
    
    for (const assignment of allAssignments) {
      if (assignment.type && migrationMap[assignment.type]) {
        needsMigration++;
        continue;
      }

      if (assignment.tasks && Array.isArray(assignment.tasks)) {
        const hasOldTypes = assignment.tasks.some(task => migrationMap[task]);
        if (hasOldTypes) {
          needsMigration++;
        }
      }
    }

    return {
      totalAssignments: allAssignments.length,
      needsMigration: needsMigration,
      requiresMigration: needsMigration > 0
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      error: error.message
    };
  }
};

/**
 * Función auxiliar para ejecutar la migración desde la consola del navegador
 * Para usar: window.runMigration()
 */
if (typeof window !== 'undefined') {
  window.runMigration = migrateAssignmentTypes;
  window.checkMigration = checkMigrationNeeded;
}
