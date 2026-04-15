import { getWhatsAppLinkStatus } from "@/lib/actions/whatsapp-actions";
import { WhatsAppSettingsClient } from "@/components/whatsapp/whatsapp-settings-client";

export default async function WhatsAppPage() {
  const status = await getWhatsAppLinkStatus();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp</h2>
        <p className="text-muted-foreground">
          Gerencie a integração do WhatsApp com sua conta
        </p>
      </div>
      <WhatsAppSettingsClient
        linked={status.linked}
        phoneNumber={status.phoneNumber}
        verified={status.verified}
        linkToken={status.linkToken}
      />
    </div>
  );
}
