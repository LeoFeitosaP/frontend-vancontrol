import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    "A variável EXPO_PUBLIC_API_URL não está configurada. Crie um arquivo .env com a URL da API.",
  );
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("@vancontrol:token");
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem("@vancontrol:token", token);
}

export async function clearToken() {
  await AsyncStorage.removeItem("@vancontrol:token");
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: object;
  auth?: boolean;
};

type PageResponse<T> = {
  content: T[];
};

export type EnderecoPayload = {
  cep: string;
  numero: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
};

export function formatLocalTimeInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function isValidLocalTime(value: string): boolean {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return Boolean(match);
}

export function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const ddd = digits.slice(0, 2);
  const firstPart = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const secondPart = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);
  let formatted = ddd ? `(${ddd}` : "";

  if (ddd.length === 2) formatted += ") ";
  if (firstPart) formatted += firstPart;
  if (secondPart) formatted += `-${secondPart}`;

  return formatted;
}

export function formatCnhValidityInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits;
}

export function formatCnhValidityForApi(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 6
    ? `${digits.slice(2)}/${digits.slice(0, 2)}`
    : value;
}

function getPageContent<T>(data: T[] | PageResponse<T>): T[] {
  return Array.isArray(data) ? data : data.content;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      await clearToken();
      throw new Error("Sua sessão expirou. Faça login novamente.");
    }
    const message = data?.message ?? data?.mensagem ?? data?.error;
    throw new Error(message ?? `Erro ${response.status}`);
  }
  return data as T;
}

export const authService = {
  async login(email: string, password: string) {
    const data = await request<{ token: string; name: string }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await saveToken(data.token);
    return data;
  },
  async register(payload: {
    name: string;
    email: string;
    password: string;
    cpf: string;
    telefone: string;
    instituicaoEnsino: string;
    turno: string;
    endereco: EnderecoPayload;
  }) {
    const data = await request<{ token: string; name: string }>(
      "/auth/register",
      {
        method: "POST",
        body: payload,
        auth: false,
      },
    );
    await saveToken(data.token);
    return data;
  },
  async logout() {
    await clearToken();
  },
};

export const rotasService = {
  listar: async () => getPageContent(await request<any[] | PageResponse<any>>("/rotas")),
  buscarPorDestino: (destino: string) =>
    request<any[] | PageResponse<any>>(`/rotas/${encodeURIComponent(destino)}`).then(getPageContent),
  criar: (payload: any) => request("/rotas", { method: "POST", body: payload }),
  atualizarDescricao: (id: string, novaDescricao: string) =>
    request(`/rotas/${id}/descricao`, {
      method: "PATCH",
      body: { novaDescricao },
    }),
  deletar: (id: string) => request(`/rotas?codigoRota=${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const veiculosService = {
  listar: async () => getPageContent(await request<any[] | PageResponse<any>>("/veiculos")),
  buscarPorPlaca: (placa: string) => request<any>(`/veiculos/${encodeURIComponent(placa)}`),
  cadastrar: (payload: {
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    capacidade: number;
    renavam: string;
    status: string;
    endereco: EnderecoPayload;
  }) =>
    request("/veiculos", { method: "POST", body: payload }),
  atualizarStatus: (placa: string, status: string) =>
    request("/veiculos/status", { method: "PUT", body: { placa, status } }),
  deletar: (placa: string) =>
    request(`/veiculos?placa=${encodeURIComponent(placa)}`, { method: "DELETE" }),
};

export const motoristasService = {
  listar: async () => getPageContent(await request<any[] | PageResponse<any>>("/motoristas")),
  buscarPorCpf: (cpf: string) => request<any>(`/motoristas/${cpf}`),
  cadastrar: (payload: any) =>
    request("/motoristas", { method: "POST", body: payload }),
  atualizarTelefone: (cpf: string, novoTelefone: string) =>
    request("/motoristas", { method: "PUT", body: { cpf, novoTelefone } }),
  deletar: (cpf: string) =>
    request(`/motoristas?cpf=${cpf}`, { method: "DELETE" }),
};

export const passageirosService = {
  listar: async () => getPageContent(await request<any[] | PageResponse<any>>("/passageiros")),
  buscarPorCpf: (cpf: string) => request<any>(`/passageiros/${cpf}`),
  atualizar: (cpf: string, payload: any) =>
    request(`/passageiros/${cpf}`, { method: "PUT", body: payload }),
  deletar: (cpf: string) =>
    request(`/passageiros?cpf=${encodeURIComponent(cpf)}`, { method: "DELETE" }),
};

export const viagensService = {
  listar: async () => getPageContent(await request<any[] | PageResponse<any>>("/viagens")),
  buscarPorCodigo: (codigo: string) => request<any>(`/viagens/${encodeURIComponent(codigo)}`),
  criar: (payload: any) =>
    request("/viagens", { method: "POST", body: payload }),
  atualizarStatus: (codigo: string) =>
    request(`/viagens/${encodeURIComponent(codigo)}`, { method: "PUT" }),
  deletar: (codigo: string) =>
    request(`/viagens/${encodeURIComponent(codigo)}`, { method: "DELETE" }),
};

export const pagamentosService = {
  buscar: (id: string) => request<any>(`/pagamentos/${encodeURIComponent(id)}`),
  listarPorPassageiro: (id: string) =>
    request<any[] | PageResponse<any>>(`/pagamentos/passageiro/${encodeURIComponent(id)}`).then(getPageContent),
  listarPorCompetencia: (competencia: string) =>
    request<any[] | PageResponse<any>>(
      `/pagamentos?competencia=${encodeURIComponent(competencia)}`,
    ).then(getPageContent),
  meusPagamentos: async () =>
    getPageContent(await request<any[] | PageResponse<any>>("/pagamentos/meus-pagamentos")),
  criar: (payload: any) =>
    request("/pagamentos", { method: "POST", body: payload }),
  atualizarStatus: (id: string, status: string, dataPagamento: string) =>
    request(`/pagamentos/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status, dataPagamento },
    }),
  deletar: (id: string) => request(`/pagamentos/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
