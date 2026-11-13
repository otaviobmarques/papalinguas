/** PaymentProvider (Manual 9.4): uma interface, uma implementação por gateway. */
export type GatewayCode = "asaas" | "mercadopago" | "stripe";
export type MetodoPagamento = "pix" | "pix_automatico" | "cartao" | "boleto";

export type EventoPagamento =
  | "pagamento_confirmado"
  | "pagamento_falhou"
  | "assinatura_cancelada"
  | "reembolso_concluido"
  | "contestacao_aberta"
  | "nota_emitida"
  | "ignorado";

export interface ClienteGateway {
  nome: string;
  email: string;
  cpf?: string;
  referenciaExterna: string; // nosso user_id
}

export interface PlanoCobranca {
  descricao: string;
  valorCentavos: number;
  ciclo: "mensal" | "anual";
}

export interface AssinaturaCriada {
  externalId: string;
  primeiraCobranca?: {
    externalId: string;
    pix?: { qrCodeBase64: string; copiaECola: string; expiraEm: string };
    /** Página do gateway para cartão: os dados do cartão nunca passam pelo nosso servidor. */
    urlPagamento?: string;
  };
}

export interface EventoTraduzido {
  eventId: string;
  tipoOriginal: string;
  evento: EventoPagamento;
  pagamentoExternalId?: string;
  assinaturaExternalId?: string;
  valorCentavos?: number;
  taxaCentavos?: number;
  liquidoCentavos?: number;
  metodo?: MetodoPagamento;
}

export interface PaymentProvider {
  code: GatewayCode;
  criarCliente(c: ClienteGateway): Promise<string>;
  criarAssinatura(clienteId: string, plano: PlanoCobranca, metodo: MetodoPagamento, referencia: string): Promise<AssinaturaCriada>;
  trocarPlano(assinaturaId: string, novo: PlanoCobranca): Promise<void>;
  cancelarAssinatura(assinaturaId: string): Promise<void>;
  reembolsar(pagamentoId: string, valorCentavos: number | null, motivo: string): Promise<{ externalId?: string }>;
  consultarPagamento(id: string): Promise<{ status: string; valorCentavos: number }>;
  validarWebhook(headers: Headers, corpo: string): boolean;
  traduzirEvento(corpo: unknown): EventoTraduzido;
}
