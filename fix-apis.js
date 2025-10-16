#!/usr/bin/env node

/**
 * Script para migrar APIs de getServerSession a auth() y UserRole a $Enums.RoleType
 */

const fs = require('fs');
const path = require('path');

// Archivos a corregir
const apiFiles = [
  'src/app/api/clients/[id]/route.ts',
  'src/app/api/clients/route.ts',
  'src/app/api/configurations/route.ts',
  'src/app/api/events/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/services/route.ts',
  'src/app/api/tenants/route.ts'
];

// Función para aplicar las correcciones
function applyFixes(filePath) {
  console.log(`Corrigiendo: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Reemplazar import UserRole con $Enums
  content = content.replace(
    /import { ([^}]*?)UserRole([^}]*?) } from '@prisma\/client'/g,
    'import { $1$Enums$2 } from \'@prisma/client\''
  );
  
  // 2. Reemplazar getServerSession(authOptions) con auth()
  content = content.replace(
    /const session = await getServerSession\(authOptions\)/g,
    'const session = await auth()'
  );
  
  // 3. Reemplazar where.property = con where["property"] =
  content = content.replace(/where\.([a-zA-Z]+) = /g, 'where["$1"] = ');
  
  // 4. Reemplazar UserRole.X con $Enums.RoleType.X
  content = content.replace(/UserRole\./g, '$Enums.RoleType.');
  
  // 5. Cambiar verificaciones de roles para usar el nuevo sistema
  content = content.replace(
    /if \(\!\[([^\]]+)\]\.includes\(session\.user\.role\)\)/g,
    function(match, roles) {
      const roleList = roles.split(',').map(r => r.trim());
      const checks = roleList.map(role => `userRoleType !== ${role}`).join(' && ');
      return `const userRoleType = session.user.role.roleId as $Enums.RoleType\n    if (${checks})`;
    }
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Corregido: ${filePath}`);
}

// Aplicar correcciones a todos los archivos
apiFiles.forEach(applyFixes);

console.log('🎉 Todas las correcciones aplicadas!');