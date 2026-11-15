import assert from "node:assert/strict";
import { after, afterEach, before, describe, it } from "node:test";
import { JSDOM } from "jsdom";
import React, { useState, type ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { IbcCadastroDTO } from "../types/ibcCadastro.types";
import { useIbcChecklistVinculos } from "../hooks/useIbcChecklistVinculos";
import type CadastroIbcPoolListType from "./CadastroIbcPoolList";
import type IbcChecklistsVinculoDrawerType from "./IbcChecklistsVinculoDrawer";
import type IbcInspecaoDrawerType from "./IbcInspecaoDrawer";
import type IbcInspecoesDrawerType from "./IbcInspecoesDrawer";

type Rtl = typeof import("@testing-library/react");

function ibc(id: string, identificador: string): IbcCadastroDTO {
  return {
    id,
    identificador,
    tipoCadastro: "NOVO",
    aptidao: "APTO",
    motivoInaptidao: null,
    custodia: "PATIO",
    dataLimite: "2027-01-01",
    primeiraInspecaoEm: "2026-01-01T00:00:00.000Z",
    baixadoEm: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    produtoId: "prod-s",
    prefixo: "HMS",
    convertedToContainerId: null,
  };
}

const IBC_A = ibc("ibc-a", "HMS00001");
const IBC_B = ibc("ibc-b", "HMS00002");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  pretendToBeVisual: true,
  url: "http://localhost/",
});

function installDomGlobals(): void {
  const win = dom.window;
  const globals: Record<string, unknown> = {
    window: win,
    document: win.document,
    navigator: win.navigator,
    Event: win.Event,
    CustomEvent: win.CustomEvent,
    EventTarget: win.EventTarget,
    KeyboardEvent: win.KeyboardEvent,
    MouseEvent: win.MouseEvent,
    PointerEvent: win.MouseEvent,
    FocusEvent: win.FocusEvent,
    UIEvent: win.UIEvent,
    getComputedStyle: win.getComputedStyle.bind(win),
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    ResizeObserver: class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  const winProps = win as unknown as Record<string, unknown>;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (!(key in globalThis)) {
      Object.defineProperty(globalThis, key, { value: winProps[key], configurable: true, writable: true });
    }
  }
}

function seededClient(): QueryClient {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  for (const item of [IBC_A, IBC_B]) {
    client.setQueryData(["ibc", "checklist-vinculos", item.id], []);
    client.setQueryData(["ibc", "inspecoes", item.id], []);
  }
  client.setQueryData(["ibc", "checklists"], []);
  return client;
}

describe("Gestão IBC Containers — fechar e reabrir painéis", () => {
  let rtl: Rtl;
  let CadastroIbcPoolList: typeof CadastroIbcPoolListType;
  let IbcInspecaoDrawer: typeof IbcInspecaoDrawerType;
  let IbcInspecoesDrawer: typeof IbcInspecoesDrawerType;
  let IbcChecklistsVinculoDrawer: typeof IbcChecklistsVinculoDrawerType;

  before(async () => {
    installDomGlobals();
    rtl = await import("@testing-library/react");
    CadastroIbcPoolList = (await import("./CadastroIbcPoolList")).default;
    IbcChecklistsVinculoDrawer = (await import("./IbcChecklistsVinculoDrawer")).default;
    IbcInspecaoDrawer = (await import("./IbcInspecaoDrawer")).default;
    IbcInspecoesDrawer = (await import("./IbcInspecoesDrawer")).default;
  });

  afterEach(() => {
    rtl.cleanup();
    document.body.style.pointerEvents = "";
  });
  after(() => dom.window.close());

  function Tela(): React.ReactElement {
    const [inspecao, setInspecao] = useState<IbcCadastroDTO | null>(null);
    const [inspecoes, setInspecoes] = useState<IbcCadastroDTO | null>(null);
    const [checklists, setChecklists] = useState<IbcCadastroDTO | null>(null);
    const vinculos = useIbcChecklistVinculos(checklists?.id ?? null);
    const noop = () => undefined;
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(CadastroIbcPoolList, {
        items: [IBC_A, IBC_B],
        produtos: [],
        canWrite: true,
        incluirHistorico: false,
        onIncluirHistoricoChange: noop,
        emptyMessage: "",
        emptyNextStep: "",
        onConverter: noop,
        onMudarProduto: noop,
        onVerHistorico: noop,
        onGerenciarChecklists: setChecklists,
        onInspecionar: setInspecao,
        onVerInspecoes: setInspecoes,
      }),
      React.createElement(IbcInspecaoDrawer, {
        open: inspecao != null,
        ibc: inspecao,
        onClose: () => setInspecao(null),
      }),
      React.createElement(IbcInspecoesDrawer, {
        open: inspecoes != null,
        ibc: inspecoes,
        onClose: () => setInspecoes(null),
      }),
      React.createElement(IbcChecklistsVinculoDrawer, {
        open: checklists != null,
        identificador: checklists?.identificador ?? null,
        state: vinculos,
        onClose: () => setChecklists(null),
      }),
    );
  }

  function render() {
    const Componente: ComponentType = Tela;
    return rtl.render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(QueryClientProvider, { client: seededClient() }, React.createElement(Componente)),
      ),
    );
  }

  async function fecharComEsc(): Promise<void> {
    rtl.fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await rtl.waitFor(() => assert.equal(document.querySelector("[role=dialog]"), null));
  }

  function assertPonteiroLiberado(): void {
    assert.notEqual(document.body.style.pointerEvents, "none");
  }

  async function abrirMenu(view: ReturnType<typeof render>, identificador: string, acao: string): Promise<void> {
    const trigger = view.getByLabelText(`Mais ações de ${identificador}`);
    rtl.fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: "mouse" });
    rtl.fireEvent.click(await view.findByRole("menuitem", { name: acao }));
  }

  it("Inspecionar: fechar libera o ponteiro e reabre no IBC clicado", async () => {
    const view = render();

    rtl.fireEvent.click(view.getAllByRole("button", { name: "Inspecionar" })[0]);
    await view.findByText(`Inspecionar ${IBC_A.identificador}`);
    await fecharComEsc();
    assertPonteiroLiberado();

    rtl.fireEvent.click(view.getAllByRole("button", { name: "Inspecionar" })[1]);
    await view.findByText(`Inspecionar ${IBC_B.identificador}`);
    rtl.fireEvent.click(view.getByRole("button", { name: "Cancelar" }));
    await rtl.waitFor(() => assert.equal(document.querySelector("[role=dialog]"), null));
    assertPonteiroLiberado();
  });

  it("Mais ações → Inspeções: fechar libera o ponteiro e o Inspecionar abre em seguida", async () => {
    const view = render();

    await abrirMenu(view, IBC_B.identificador, "Inspeções");
    await view.findByText(`Inspeções de ${IBC_B.identificador}`);
    await fecharComEsc();
    assertPonteiroLiberado();

    await abrirMenu(view, IBC_A.identificador, "Inspeções");
    await view.findByText(`Inspeções de ${IBC_A.identificador}`);
    await fecharComEsc();
    assertPonteiroLiberado();

    rtl.fireEvent.click(view.getAllByRole("button", { name: "Inspecionar" })[1]);
    await view.findByText(`Inspecionar ${IBC_B.identificador}`);
  });

  it("Mais ações → Checklists: fechar pelo X libera o ponteiro e reabre no IBC clicado", async () => {
    const view = render();

    await abrirMenu(view, IBC_A.identificador, "Checklists");
    await view.findByText(`Checklists de ${IBC_A.identificador}`);
    rtl.fireEvent.click(view.getByRole("button", { name: "Fechar" }));
    await rtl.waitFor(() => assert.equal(document.querySelector("[role=dialog]"), null));
    assertPonteiroLiberado();

    await abrirMenu(view, IBC_B.identificador, "Checklists");
    await view.findByText(`Checklists de ${IBC_B.identificador}`);
  });

  it("Detalhe do identificador: fechar libera o ponteiro e o menu abre em seguida", async () => {
    const view = render();

    rtl.fireEvent.click(view.getByLabelText(`Detalhe de ${IBC_A.identificador}`));
    await rtl.waitFor(() => assert.notEqual(document.querySelector("[role=dialog]"), null));
    await fecharComEsc();
    assertPonteiroLiberado();

    await abrirMenu(view, IBC_A.identificador, "Inspeções");
    await view.findByText(`Inspeções de ${IBC_A.identificador}`);
  });
});
