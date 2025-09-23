# repositorio-teste-creator

## Configuração do Stripe

Para ativar a cobrança dos planos é necessário definir as variáveis de ambiente abaixo no `.env` do projeto:

- `STRIPE_SECRET_KEY`: chave secreta da API da Stripe.
- `STRIPE_WEBHOOK_SECRET`: segredo do webhook configurado no painel da Stripe.
- `STRIPE_SUCCESS_URL` (opcional): URL completa de redirecionamento após um checkout bem sucedido. Caso não seja definida, será utilizado `NEXT_PUBLIC_BASE_URL/planos?success=true&session_id={CHECKOUT_SESSION_ID}`.
- `STRIPE_CANCEL_URL` (opcional): URL de cancelamento do checkout. Por padrão utiliza `NEXT_PUBLIC_BASE_URL/planos?canceled=true`.
- `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE`: IDs de preço (Price ID) dos planos cadastrados na Stripe utilizados pelo script de seed.

Certifique-se também de atualizar os registros de planos existentes no banco de dados com os respectivos `stripePriceId` antes de habilitar a cobrança em produção.