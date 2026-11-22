import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@indoor/ui';
import { useSearchParams } from 'react-router';
import { ModulePage, ModuleRoute } from '../../app/module-route';
import { ApiKeysPanel } from './api-keys-panel';
import { DELIVERY_TABLE_PREFIX, DeliveriesPanel } from './deliveries-panel';
import { copy } from './shared';
import { INTEGRATIONS_TOUR } from './tour';
import { WebhooksPanel } from './webhooks-panel';

const TABS = ['keys', 'webhooks', 'log'] as const;
type Tab = (typeof TABS)[number];

const apiUrl = `${String(import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')}/functions/v1/api`;

function ApiDocs() {
  const openapi = `${apiUrl}/v1/openapi.json`;
  return (
    <section
      data-tour="integrations-docs"
      className="grid gap-2 rounded-md border border-line bg-surface p-4"
    >
      <h2 className="font-bold">Alamat API</h2>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-sm bg-canvas px-2 py-1 font-mono text-sm">
          {apiUrl}
        </code>
        <Button size="sm" onClick={() => copy(apiUrl, 'Alamat API')}>
          Salin
        </Button>
        <Button size="sm" asChild>
          <a href={openapi} target="_blank" rel="noreferrer">
            OpenAPI
          </a>
        </Button>
      </div>
      <p className="text-ink-muted text-sm">
        Perubahan lokasi dan jam lewat API masuk ke draft dan tampil di Visitor setelah publish.
        Penutupan berlaku langsung. Panduan lengkap ada di dokumentasi integrasi
        (docs/integrasi/api.md).
      </p>
    </section>
  );
}

function IntegrationsModule() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: Tab = TABS.includes(requested as Tab) ? (requested as Tab) : 'keys';
  return (
    <div className="grid gap-4">
      <Tabs
        value={tab}
        onValueChange={(value) => setParams(value === 'keys' ? {} : { tab: value })}
      >
        <TabsList data-tour="integrations-tabs">
          <TabsTrigger value="keys">Kunci API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook</TabsTrigger>
          <TabsTrigger value="log">Log pengiriman</TabsTrigger>
        </TabsList>
        <TabsContent value="keys">
          <ApiKeysPanel />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksPanel
            onShowLog={(id) => setParams({ tab: 'log', [`${DELIVERY_TABLE_PREFIX}webhook`]: id })}
          />
        </TabsContent>
        <TabsContent value="log">
          <DeliveriesPanel />
        </TabsContent>
      </Tabs>
      <ApiDocs />
    </div>
  );
}

export function IntegrationsPage() {
  return (
    <ModuleRoute module="integrations">
      {(access) => (
        <ModulePage module="integrations" access={access} tour={INTEGRATIONS_TOUR}>
          <IntegrationsModule />
        </ModulePage>
      )}
    </ModuleRoute>
  );
}
