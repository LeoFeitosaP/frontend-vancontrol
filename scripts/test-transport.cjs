const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function loadTransport(fetch = async () => ({ ok: true, status: 204 }), configured = true) {
  const module = { exports: {} };
  const js = ts.transpileModule(readFileSync(require.resolve('../services/transport.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, { module, exports: module.exports, require: () => ({ getItem: async () => 'test-token' }),
    process: { env: configured ? { EXPO_PUBLIC_TRANSPORT_API_URL: 'https://transport.test/' } : {} },
    Date, Number, Boolean, Math, String, encodeURIComponent, AbortController, setTimeout, clearTimeout, fetch });
  return module.exports;
}
const api = loadTransport();
test('GPS exige coordenadas válidas e sinal com até 90 segundos', () => {
  const now = Date.parse('2026-11-05T01:00:00Z');
  const point = { latitude: -23, longitude: -47, atualizadoEm: new Date(now - 90000).toISOString() };
  assert.equal(api.isFreshLocation(point, now), true);
  assert.equal(api.isFreshLocation({ ...point, atualizadoEm: new Date(now - 90001).toISOString() }, now), false);
  assert.equal(api.isFreshLocation({ ...point, latitude: 91 }, now), false);
  assert.equal(api.isFreshLocation({ ...point, atualizadoEm: 'invalid' }, now), false);
  assert.equal(api.isFreshLocation({ ...point, atualizadoEm: new Date(now + 60000).toISOString() }, now), false);
  assert.equal(api.isFreshLocation(null, now), false);
});
test('ocupação desconhecida é diferente de van vazia; barra não ultrapassa 100%', () => {
  assert.equal(api.occupancyRatio(null), null);
  assert.equal(api.occupancyRatio({ embarcados: 0, capacidade: 15 }), 0);
  assert.equal(api.occupancyRatio({ embarcados: 12, capacidade: 15 }), .8);
  assert.equal(api.occupancyRatio({ embarcados: 18, capacidade: 15 }), 1);
  assert.equal(api.occupancyRatio({ embarcados: 1, capacidade: 0 }), null);
  assert.equal(api.occupancyRatio({ embarcados: -1, capacidade: 15 }), null);
});
test('data de presença usa o calendário local, inclusive perto da meia-noite', () => {
  assert.equal(api.localDay(new Date(2026, 10, 4, 23, 59)), '2026-11-04');
  assert.equal(api.localDay(new Date(2026, 10, 5, 0, 0)), '2026-11-05');
});
test('presença envia token, viagem escapada e corpo; aceita resposta 204', async () => {
  let request;
  const service = loadTransport(async (url, options) => { request = { url, ...options }; return { ok: true, status: 204 }; });
  await service.transportService.attendance('V/01', '2026-11-04', 'VOU');
  assert.equal(request.url, 'https://transport.test/viagens/V%2F01/presenca');
  assert.equal(request.method, 'PUT');
  assert.equal(request.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(request.body), { data: '2026-11-04', presenca: 'VOU' });
});
test('falha de presença é propagada para permitir rollback da interface', async () => {
  const service = loadTransport(async () => ({ ok: false, status: 503 }));
  await assert.rejects(service.transportService.attendance('V1', '2026-11-04', 'NAO_VOU'), /503/);
});
test('acompanhamento suporta cancelamento e usa a data selecionada', async () => {
  let request;
  const controller = new AbortController(); controller.abort();
  const service = loadTransport(async (url, options) => { request = { url, ...options }; return { ok: true, status: 200, json: async () => ({ presenca: null }) }; });
  await service.transportService.snapshot('V1', '2026-11-04', controller.signal);
  assert.equal(request.signal.aborted, true);
  assert.equal(request.url, 'https://transport.test/viagens/V1/acompanhamento?data=2026-11-04');
  assert.equal(loadTransport(undefined, false).hasTransportAPI, false);
});
