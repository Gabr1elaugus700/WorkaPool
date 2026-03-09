# 🚀 GUIA RÁPIDO - Restaurar Loss Reasons (TEXTO)

## ✅ Método MAIS FÁCIL (Copiar e Colar)

### 📋 **1. Prepare os dados no Excel**

Abra sua planilha e organize assim:

| Número do Pedido | Código | Descrição | Data | Vendedor |
|------------------|--------|-----------|------|----------|
| 12345 | FREIGHT | Cliente achou frete caro | 09/03/2026 | 001 |
| 12346 | PRICE | Preço alto | 08/03/2026 | 002 |

---

### 📝 **2. Copie TUDO (incluindo cabeçalho)**

No Excel:
1. Selecione **TODAS as células** (incluindo os títulos)
2. **Ctrl + C** (copiar)

---

### 💾 **3. Cole no arquivo de texto**

1. Abra o Notepad (Bloco de notas)
2. **Ctrl + V** (colar)
3. Salve como: `C:\Users\gabriel\WorkaPool\backend\scripts\loss_reasons_data.txt`

**OU** use este comando no PowerShell:
```powershell
# Cole os dados abaixo e aperte Enter
notepad C:\Users\gabriel\WorkaPool\backend\scripts\loss_reasons_data.txt
```

---

### ⚡ **4. Execute o script**

```bash
cd C:\Users\gabriel\WorkaPool\backend
npx ts-node scripts/restore-loss-reasons-simple.ts
```

---

## 📋 **Formatos aceitos:**

O script detecta automaticamente:
- ✅ **TAB** (quando você copia do Excel)
- ✅ **Vírgula** (,)
- ✅ **Ponto-e-vírgula** (;)

---

## 🎯 **Exemplo de arquivo:**

Veja: `scripts/loss_reasons_example.txt`

```
12345	FREIGHT	Cliente achou o frete muito caro	09/03/2026	001
12346	PRICE	Preço maior que o concorrente	08/03/2026	002
12347	MARGIN	Margem muito baixa	07/03/2026	001
```

---

## 💡 **Dicas:**

1. **Não precisa Header?** Sem problema! O script detecta automaticamente
2. **Linhas vazias?** São ignoradas automaticamente
3. **Data:** Pode ser `DD/MM/YYYY` ou `YYYY-MM-DD`
4. **Códigos:** FRETE, FREIGHT, PREÇO, PRICE, etc (case-insensitive)

---

## ⚠️ **Se der erro:**

Me mostre:
1. As primeiras 3 linhas do arquivo `.txt`
2. A mensagem de erro completa

---

## 🔄 **Ordem das colunas:**

1. **Número do Pedido** (obrigatório)
2. **Código** (FREIGHT, PRICE, MARGIN, STOCK, OTHER)
3. **Descrição** (texto livre)
4. **Data** (DD/MM/YYYY)
5. **Vendedor** (código do vendedor)

**IMPORTANTE:** Mantenha essa ordem!
