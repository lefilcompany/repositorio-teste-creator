// components/auth/EmailPreview.tsx
'use client';

import { getPasswordResetEmailTemplate } from '@/lib/email';

interface EmailPreviewProps {
    userName?: string;
    resetUrl?: string;
}

export default function EmailPreview({
    userName = "João Silva",
    resetUrl = "http://localhost:3000/reset-password?token=abc123"
}: EmailPreviewProps) {
    const emailHtml = getPasswordResetEmailTemplate(userName, resetUrl);

    return (
        <div className="w-full h-screen">
            <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: emailHtml }}
            />
        </div>
    );
}
