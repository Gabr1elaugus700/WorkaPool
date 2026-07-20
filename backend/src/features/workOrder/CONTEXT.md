# Ordem de Serviço

Facility and maintenance tickets inside Pool Técnica, with optional inspections and checklists.

## Language

**Ordem de Serviço**:
A facility/maintenance ticket: description, priority, department, assignee, and status lifecycle.
_Avoid_: Pedido, Acompanhamento, Order, WorkOrder (in speech — prefer Ordem de Serviço until one model remains)

**Status da OS**:
ABERTA, EM_ANDAMENTO, FINALIZADA, CANCELADA.
_Avoid_: Situação da Carga, Status do Acompanhamento

**Vistoria**:
An inspection event, usually tied to checklists.
_Avoid_: Inspection (in speech), Checklist as if it were the vistoria itself

**Checklist**:
The list of items verified in a Vistoria; may be based on a department template.
_Avoid_: Vistoria (the event), Modelo de Checklist (the template)

**Modelo de Checklist**:
Reusable checklist template owned by a Departamento.
_Avoid_: Checklist (the filled instance)

**Departamento**:
Org unit that can receive Ordens de Serviço and own checklist models.
_Avoid_: Role (authorization), Representante
