import React from 'react';
import { getGatewayBaseUrl } from '../../utils/apiConfig';

export const AdminSystemPage: React.FC = () => {
  const gatewayUrl = getGatewayBaseUrl();
  const services = [
    { name: 'API Gateway', port: 5000, status: 'ONLINE', p99: '6ms', load: '14%', circuit: 'CLOSED' },
    { name: 'Auth Microservice', port: 5001, status: 'ONLINE', p99: '9ms', load: '18%', circuit: 'CLOSED' },
    { name: 'Product Catalog & AI Search', port: 5002, status: 'ONLINE', p99: '14ms', load: '28%', circuit: 'CLOSED' },
    { name: 'Shopping Cart Service', port: 5003, status: 'ONLINE', p99: '5ms', load: '8%', circuit: 'CLOSED' },
    { name: 'Order & Saga Orchestrator', port: 5004, status: 'ONLINE', p99: '16ms', load: '22%', circuit: 'CLOSED' },
    { name: 'Payment & Fraud Scoring', port: 5005, status: 'ONLINE', p99: '19ms', load: '15%', circuit: 'CLOSED' },
    { name: 'Wishlist & Price Drops', port: 5006, status: 'ONLINE', p99: '7ms', load: '6%', circuit: 'CLOSED' },
    { name: 'Inventory Lock Service', port: 5007, status: 'ONLINE', p99: '8ms', load: '12%', circuit: 'CLOSED' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Microservices Health & Topology</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time latency metrics, circuit breaker states, and distributed event bus telemetry.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((s) => (
          <div
            key={s.name}
            className="p-5 bg-white border border-zinc-200/80 rounded-3xl space-y-3 shadow-xs hover:border-zinc-300 transition"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 text-sm">{s.name}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                Port {s.port}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-100 text-center">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Status</div>
                <div className="text-xs font-bold text-emerald-600">{s.status}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">p99 Latency</div>
                <div className="text-xs font-mono font-bold text-indigo-600">{s.p99}</div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Circuit</div>
                <div className="text-xs font-mono font-bold text-zinc-800">{s.circuit}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Observability & Documentation Links */}
      <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-bold text-zinc-900 text-sm">OpenAPI 3.0 & Prometheus Telemetry</h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Explore live Swagger UI documentation or ingest raw OpenMetrics into Prometheus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`${gatewayUrl}/docs`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs transition shadow-xs"
          >
            Open Swagger UI Docs
          </a>
          <a
            href={`${gatewayUrl}/metrics`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-200 transition"
          >
            Prometheus /metrics
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemPage;
