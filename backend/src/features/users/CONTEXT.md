# Identity

Who can sign in, what they are allowed to do, and how they link to ERP sales reps.

## Language

**User**:
An app login account with a Role and optional Representante linkage (codRep).
_Avoid_: Cliente, Representante (when you mean the ERP person without an account)

**Role**:
Authorization profile: ADMIN, USER, VENDAS, LOGISTICA, ALMOX, GERENTE_DPTO.
_Avoid_: Departamento (org unit ≠ permission set)

**Representante**:
ERP sales-rep identity (codRep) optionally bound to a User to scope sales data.
_Avoid_: User as synonym

**WorkaPool**:
The internal product (SPA + API) used by Pool Técnica staff.
_Avoid_: Pool (alone), Sapiens, poolbi

**Sapiens**:
External ERP — system of record for Pedidos, Clientes, and Representantes.
_Avoid_: banco local, PostgreSQL, WorkaPool

**poolbi**:
Separate reporting database used for product-group labels. Not a domain actor.
_Avoid_: WorkaPool, Sapiens
