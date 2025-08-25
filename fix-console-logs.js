const fs = require('fs');
const path = require('path');

// Files to process based on the warnings
const filesToFix = [
  './app/(app)/content/result/page.tsx',
  './app/(app)/historico/page.tsx', 
  './app/(app)/historico/[id]/page.tsx',
  './app/(app)/home/page.tsx',
  './app/(app)/layout.tsx',
  './app/(app)/marcas/page.tsx',
  './app/(app)/marcas/page_fixed.tsx',
  './app/(app)/perfil/page.tsx',
  './app/(app)/personas/page.tsx',
  './app/(app)/planos/page.tsx',
  './app/(app)/temas/page.tsx',
  './app/(auth)/cadastro/page.tsx',
  './app/api/actions/route.ts',
  './app/api/actions/[id]/approve/route.ts',
  './app/api/actions/[id]/review/route.ts',
  './app/api/actions/[id]/route.ts',
  './app/api/admin/initialize-counters/route.ts',
  './app/api/auth/complete-login/route.ts',
  './app/api/auth/login/route.ts',
  './app/api/auth/logout/route.ts',
  './app/api/auth/refresh/route.ts',
  './app/api/auth/register/route.ts',
  './app/api/auth/verify-password/route.ts',
  './app/api/brands/route.ts',
  './app/api/brands/[id]/route.ts',
  './app/api/cleanup/route.ts',
  './app/api/download-image/route.ts',
  './app/api/generate-image/route.ts',
  './app/api/image/[actionId]/route.ts',
  './app/api/personas/route.ts',
  './app/api/personas/[id]/route.ts',
  './app/api/plan-content/route.ts',
  './app/api/refatorar-image/route.ts',
  './app/api/refatorar-text/route.ts',
  './app/api/revisar-imagem/route.ts',
  './app/api/team-members/route.ts',
  './app/api/teams/create/route.ts',
  './app/api/teams/join/route.ts',
  './app/api/teams/requests/[requestId]/route.ts',
  './app/api/teams/route.ts',
  './app/api/teams/[id]/members/[userId]/route.ts',
  './app/api/teams/[id]/requests/route.ts',
  './app/api/teams/[id]/route.ts',
  './app/api/themes/route.ts',
  './app/api/themes/[id]/route.ts',
  './app/api/users/deactivate-account/route.ts',
  './app/api/users/delete-account/route.ts',
  './app/api/users/team-members/route.ts',
  './app/api/users/[id]/route.ts',
  './components/content/content.tsx',
  './components/marcas/brandDialog.tsx',
  './components/perfil/accountManagement.tsx',
  './components/perfil/additionalInfoCard.tsx',
  './components/perfil/changePasswordDialog.tsx',
  './components/perfil/leaveTeamDialog.tsx',
  './components/perfil/personalInfoForm.tsx',
  './components/plan.tsx',
  './components/review.tsx',
  './components/topbar.tsx',
  './components/ui/download-button.tsx',
  './lib/api.ts',
  './lib/cache.ts',
  './lib/cleanup.ts',
  './lib/jwt.ts',
  './lib/team-counters.ts'
];

function removeConsoleLogs(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove various console statements but preserve structure
    const cleanedContent = content
      .replace(/^\s*console\.(log|error|warn|info|debug)\([^)]*\);\s*$/gm, '')
      .replace(/^\s*console\.(log|error|warn|info|debug)\([^)]*\);\s*$/gm, '')
      .replace(/console\.(log|error|warn|info|debug)\([^)]*\);\s*/g, '');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`Fixed console statements in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

filesToFix.forEach(removeConsoleLogs);
