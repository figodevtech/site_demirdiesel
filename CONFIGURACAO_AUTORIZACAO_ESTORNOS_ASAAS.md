# Autorização de estornos Pix solicitados pelo ERP

O webhook de eventos de pagamento e o webhook de autorização de saídas são
configurações diferentes. A nova rota implementa somente `PIX_REFUND`, para
estorno integral de uma venda online ainda não enviada. Cartão continua pelo
endpoint de reembolso de cobrança; não existe um tipo de autorização de cartão
documentado nesse mecanismo.

## Preparação

1. Execute `npm run db:status`, `npm run db:dry-run` e `npm run db:deploy` na loja.
   A migration nova é `20261008120000_authorize_erp_pix_refund.sql`.
2. Gere um token aleatório exclusivo de pelo menos 32 caracteres e configure
   `ASAAS_REFUND_AUTHORIZATION_TOKEN` no ambiente da loja e no deploy. Não reutilize
   a chave de API ou o token do webhook de pagamentos.
3. Publique o código atualizado da loja antes de alterar a configuração no Asaas.

## Configuração na conta Asaas da Demir

Em **Integrações → Mecanismos de segurança**, configure a URL de validação:

```text
https://demirdiesel.com.br/api/webhooks/asaas/authorize-refund
```

Informe um e-mail para alertas e o mesmo token de `ASAAS_REFUND_AUTHORIZATION_TOKEN`.
Ative a opção de autorização para estornos Pix conforme a configuração disponível
na conta. Não substitua a URL do webhook comum `/api/webhooks/asaas`.

Este mecanismo de segurança pode também encaminhar outras saídas da conta.
**A rota recusa TRANSFER, BILL, PIX_QR_CODE, MOBILE_PHONE_RECHARGE e PAYMENT_SPLIT**,
pois não há solicitações correspondentes implementadas. Antes de ativar, confira
o impacto sobre as outras operações da Demir. Não habilite validação de split ou
direcione fluxos financeiros adicionais para essa rota esperando aprovação.

## O que a rota confere

- Token válido, operação Pix do tipo CREDIT_REFUND e referência do pagamento.
- Transação e pagamento relidos na API Asaas da conta configurada.
- Transação original vinculada à cobrança e valor integral sem divergência.
- Pedido pago, online, Asaas e antes do envio/entrega.
- Solicitação prévia do ERP, sem recusa ativa e sem operação anterior à tentativa.
- Registro de autorização por operação e tentativa, impedindo aprovar duas
  operações diferentes para a mesma solicitação. Reenvios da mesma operação
  são idempotentes enquanto os estados financeiros e físicos permanecem válidos.

A resposta APPROVED autoriza o processamento: não comprova reembolso concluído.
O ERP só cancela e devolve estoque após REFUNDED. Erro de rede ou banco nunca
produz aprovação.

## Homologação e pedido #21

O Asaas identificou o #21 como Pix. A tentativa consultada estava aguardando
autorização. Publicar/configurar uma nova URL não garante que o Asaas reenvie
automaticamente a autorização da operação já pendente. Confira a situação no
painel antes de criar outra solicitação. Não reenvie a chamada de refund para
tentar aprovar uma operação existente.

Teste com uma operação controlada e confira os logs do mecanismo de segurança,
o registro em `site_order_refund_authorization` e a confirmação financeira.
Não confunda esses logs com os eventos PAYMENT_REFUND_DENIED/PAYMENT_REFUNDED.
Falhas consecutivas na validação podem cancelar a operação no Asaas.

Fontes:
- https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks
- https://docs.asaas.com/reference/recuperar-uma-unica-transacao
- https://docs.asaas.com/reference/estornar-cobranca
