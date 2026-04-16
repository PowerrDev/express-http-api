# Klee HTTP API

- **Última atualização**: 11 de Abril de 2026

# Como Integrar: API de Migração Jazzcoins & Luminas

## Base URL

```
https://klee-http-api.up.railway.app/api/migrate/jazzcoins
```

## Autenticação (Token)

- Tipo: **Bearer Token**
- Header: `Authorization: Bearer seutokenvaiaqui`
- PS: O token foi definido no `.env` do Klee: `JAZZ_MIGRATION_SECRET` (eu irei te enviar)

## Método (IMPORTANTE)

```
POST
```

## Corpo da Requisição (JSON) :o

| Campo     | Tipo   | Obrigatório | Descrição                                            |
| --------- | ------ | ----------- | ---------------------------------------------------- |
| userId    | string | sim         | ID do usuário no bot Klee                            |
| amount    | number | sim         | Quantidade de Jazzcoins a migrar                     |
| requestId | string | sim         | ID único da requisição (UUID) para evitar duplicação |

**Exemplo em Python usando requests:**

```python
import requests
import uuid

url = "https://klee-http-api.up.railway.app/api/migrate/jazzcoins"
token = "KLEE_JAZZ_PRIVATE_2026_X9A71"

payload = {
    "userId": "123456789",
    "amount": 1000,
    "requestId": str(uuid.uuid4())
}

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Respostas

- **Sucesso**

```json
{
  "success": true
}
```

- **Duplicata (mesmo requestId já registrado)**

```json
{
  "success": true,
  "duplicate": true
}
```

- **Erro de autenticação**

```json
{
  "error": "[401] | com.klee.http-api | Não autorizado"
}
```

- **Erro de validação**

```json
{
  "error": "[400] | com.klee.http-api | Campos obrigatórios ausentes"
}
```

OU

```json
{
  "error": "[400] | com.klee.http-api | Quantidade inválida"
}
```

- **Erro interno**

```json
{
  "error": "[500] | com.klee.http-api | Erro interno ao migrar moedas"
}
```

## Boas práticas :D

1. **Não repetir requestId**: cada migração deve ter um ID único, evitando que tenha requests repetidas
2. **Só remover Jazzcoins do Jazzghost após sucesso da requisição**;
3. **BigInt**: a quantidade (`amount`) deve ser número inteiro positivo;
4. **Segurança**: não compartilhe o token secreto com NINGUÉM ou pessoas má-intencionadas podem utilizar o site;
5. **Transação**: a API garante que a adição de Luminas só ocorre se o registro de migração for criado com sucesso (IMPORTANTE)
6. **Upsert**: se o usuário nunca tiver usado o Klee, o bot vai lidar com isso normalmente.
